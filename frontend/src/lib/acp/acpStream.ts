import { Channel } from "@tauri-apps/api/core";
import type { AcpStreamEvent } from "../../ipc/bindings";
import { commands } from "../../ipc/bindings";
import { useSettingsStore } from "../../stores/settingsStore";
import { isTauriRuntime } from "../isTauriRuntime";

export type { AcpStreamEvent };

export interface AcpPromptOptions {
  conversationId: string;
  userText: string;
  cwd?: string | null;
  signal?: AbortSignal;
  onEvent: (event: AcpStreamEvent) => void;
}

function resolveAgentShowConsole(override?: boolean): boolean {
  if (override !== undefined) return override;
  return useSettingsStore.getState().agentDebugConsole;
}

/** 通过 Tauri ACP 后端发起一轮 prompt，流式接收 ACP 事件。 */
export async function runAcpPrompt(options: AcpPromptOptions): Promise<void> {
  if (!isTauriRuntime()) {
    throw new Error("ACP 助手需要在 Tauri 桌面环境中运行");
  }

  const onEvent = new Channel<AcpStreamEvent>();
  onEvent.onmessage = (event) => {
    options.onEvent(event);
  };

  const abortListener = () => {
    void commands.acpCancel(options.conversationId).catch(() => {});
  };
  options.signal?.addEventListener("abort", abortListener);

  try {
    const result = await commands.acpPrompt(
      options.conversationId,
      options.userText,
      options.cwd ?? null,
      onEvent,
    );
    if (result.status === "error") {
      throw new Error(result.error);
    }
  } finally {
    options.signal?.removeEventListener("abort", abortListener);
  }
}

export async function respondAcpPermission(
  requestId: number,
  optionId: string,
): Promise<void> {
  const result = await commands.acpRespondPermission(requestId, optionId);
  if (result.status === "error") {
    throw new Error(result.error);
  }
}

export async function connectAcpAgent(
  commandLine: string,
  showConsole?: boolean,
): Promise<void> {
  const result = await commands.acpConnect(commandLine, resolveAgentShowConsole(showConsole));
  if (result.status === "error") {
    throw new Error(result.error);
  }
}

export async function connectDefaultAcpAgent(showConsole?: boolean): Promise<void> {
  const result = await commands.acpConnectDefault(resolveAgentShowConsole(showConsole));
  if (result.status === "error") {
    throw new Error(result.error);
  }
}

export async function getAcpDefaultCommand(): Promise<string | null> {
  const result = await commands.acpGetDefaultCommand();
  if (result.status === "error") {
    return null;
  }
  return result.data;
}

export async function getAcpStatus() {
  const result = await commands.acpGetStatus();
  if (result.status === "error") {
    throw new Error(result.error);
  }
  return result.data;
}

/** 启动时连接当前激活的 ACP agent（默认内置 /agent）。 */
let connectInFlight: Promise<void> | null = null;

export async function connectActiveAcpAgent(showConsole?: boolean): Promise<void> {
  if (!isTauriRuntime()) return;
  if (connectInFlight) {
    return connectInFlight;
  }

  connectInFlight = (async () => {
    const {
      getActiveAcpService,
      isBuiltinAcpService,
      resolveAcpModelSelectionId,
      useAcpServicesStore,
    } = await import("../../stores/acpServicesStore");
    const { syncAcpAgentConfigFile } = await import("./syncAgentConfig");

    const { services } = useAcpServicesStore.getState();
    const active = getActiveAcpService(services);
    const show = resolveAgentShowConsole(showConsole);

    const modelSelectionId = resolveAcpModelSelectionId(active);
    if (!modelSelectionId) {
      console.warn("[ACP] 未配置 AI 模型，跳过 Agent 自动启动");
      return;
    }
    await syncAcpAgentConfigFile(modelSelectionId);

    if (active && !isBuiltinAcpService(active) && active.executablePath.trim()) {
      await connectAcpAgent(active.executablePath.trim(), show);
      return;
    }

    await connectDefaultAcpAgent(show);
  })().catch((error) => {
    console.warn("[ACP] 启动连接失败:", error);
  }).finally(() => {
    connectInFlight = null;
  });

  return connectInFlight;
}
