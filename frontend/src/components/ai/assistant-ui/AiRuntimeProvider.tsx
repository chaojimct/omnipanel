import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import type {
  AppendMessage,
  ExternalStoreAdapter,
  ThreadMessage,
} from "@assistant-ui/react";
import { useExternalStoreRuntime } from "@assistant-ui/react";

import { commands } from "../../../ipc/bindings";
import {
  resolveModelSelection,
  useAiModelsStore,
} from "../../../stores/aiModelsStore";
import { useSettingsStore } from "../../../stores/settingsStore";
import { resolveScenarioModelSelectionId } from "../../../lib/aiScenarioModels";
import { useAiStore } from "../../../stores/aiStore";
import { getModuleAiContextText, getModuleMcpTools, executeModuleMcpTool } from "../../../lib/ai/context";
import { registerAiPromptSubmit, type InlineTerminalAiTarget } from "../../../lib/ai/submitAiPrompt";
import { registerAiGenerationCancel } from "../../../lib/ai/cancelAiGeneration";
import { useBlocksStore, isAiThreadMessage } from "../../../stores/blocksStore";
import { useTerminalUiStore } from "../../../modules/terminal/terminalUiStore";
import {
  aiThreadToModelMessages,
  getResolvedAiThread,
  pushAssistantErrorMessage,
} from "../../../modules/terminal/aiThreadBridge";
import {
  cancelPendingInlineTools,
  createInlineTerminalToolCall,
  newInlineToolCallId,
  rejectInlineTerminalTool,
  waitForInlineToolDecision,
} from "../../../modules/terminal/inlineToolBridge";
import type { ModuleKey } from "../../../lib/paths";
import { moduleKeyFromPath } from "../../../lib/workspaceModuleRoutes";

import {
  buildModelMessages,
  mergeToolCallDeltas,
  streamModelChat,
  type AiToolDef,
  type ModelConfig,
} from "./chatModel";
import {
  aiMessagesToThreadMessages,
  threadMessagesToAiMessages,
} from "./messageBridge";

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function extractUserContent(message: ThreadMessage | AppendMessage): string {
  for (const part of message.content) {
    if (part.type === "text") return part.text;
  }
  return "";
}

async function loadExternalMcpToolDefs(): Promise<AiToolDef[]> {
  if (!isTauriRuntime()) return [];
  const listResult = await commands.mcpListServices();
  if (listResult.status !== "ok") return [];

  const running = listResult.data.filter((s) => s.status === "running");
  const defs: AiToolDef[] = [];

  for (const service of running) {
    const toolsResult = await commands.mcpListServiceTools(service.id);
    if (toolsResult.status !== "ok") continue;
    for (const tool of toolsResult.data) {
      defs.push({
        serviceId: service.id,
        originalName: tool.name,
        description: tool.description ?? tool.name,
        kind: "external",
      });
    }
  }

  return defs;
}

function loadModuleToolDefs(moduleKey: ModuleKey | null): AiToolDef[] {
  if (!moduleKey) return [];
  return getModuleMcpTools(moduleKey).map((tool) => ({
    serviceId: `module:${moduleKey}`,
    originalName: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
    kind: "module" as const,
    moduleKey,
  }));
}

async function loadAiToolDefs(moduleKey: ModuleKey | null): Promise<AiToolDef[]> {
  const [moduleTools, externalTools] = await Promise.all([
    Promise.resolve(loadModuleToolDefs(moduleKey)),
    loadExternalMcpToolDefs(),
  ]);
  return [...moduleTools, ...externalTools];
}

async function executeToolCall(
  toolDef: AiToolDef,
  args: string,
): Promise<{ result: string; success: boolean }> {
  if (toolDef.kind === "module" && toolDef.moduleKey) {
    return executeModuleMcpTool(toolDef.moduleKey, toolDef.originalName, args);
  }
  return executeMcpTool(toolDef.serviceId, toolDef.originalName, args);
}

async function executeMcpTool(
  serviceId: string,
  toolName: string,
  args: string,
): Promise<{ result: string; success: boolean }> {
  const result = await commands.mcpCallTool(serviceId, toolName, args);
  if (result.status !== "ok") {
    return { result: result.error ?? "MCP tool call failed", success: false };
  }
  if (result.data.isError) {
    return { result: result.data.content || "MCP tool returned error", success: false };
  }
  return { result: result.data.content, success: true };
}

const EMPTY_MESSAGE_LIST: ThreadMessage[] = [];
const GENERATION_STALL_MS = 120_000;
const INLINE_TOOL_DECISION_TIMEOUT_MS = 120_000;
const AI_TOOL_LOAD_TIMEOUT_MS = 20_000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function inlineHasAssistantContent(blockId: string): boolean {
  const block = useBlocksStore.getState().findBlockById(blockId);
  if (!block) return false;
  return getResolvedAiThread(block).some(
    (item) =>
      isAiThreadMessage(item) &&
      item.role === "assistant" &&
      Boolean(item.content.trim() || item.reasoning?.trim()),
  );
}

function finalizeInlineBlock(
  inline: InlineTerminalAiTarget,
  options: { failed: boolean; aborted?: boolean; reason?: string },
): void {
  if (options.aborted) {
    cancelPendingInlineTools(inline.blockId);
  }
  if (options.reason && !inlineHasAssistantContent(inline.blockId)) {
    pushAssistantErrorMessage(inline.blockId, options.reason);
  }
  useBlocksStore.getState().updateBlock(inline.blockId, {
    status: options.failed ? "failed" : "completed",
    exitCode: options.failed ? (options.aborted ? 130 : 1) : 0,
  });
  useTerminalUiStore.getState().setExpandedAiBlock(inline.sessionId, inline.blockId);
}

export function AiRuntimeProvider({ children }: { children: ReactNode }) {
  const conversations = useAiStore((s) => s.conversations);
  const activeConversationId = useAiStore((s) => s.activeConversationId);
  const isGenerating = useAiStore((s) => s.isGenerating);
  const currentModelSelectionId = useAiStore((s) => s.currentModelSelectionId);
  const reasoningEffort = useAiStore((s) => s.reasoningEffort);
  const addMessage = useAiStore((s) => s.addMessage);
  const updateMessage = useAiStore((s) => s.updateMessage);
  const appendStreamContent = useAiStore((s) => s.appendStreamContent);
  const appendStreamReasoning = useAiStore((s) => s.appendStreamReasoning);
  const setIsGenerating = useAiStore((s) => s.setIsGenerating);
  const setConnectedMcpServices = useAiStore((s) => s.setConnectedMcpServices);
  const setCurrentModelSelectionId = useAiStore((s) => s.setCurrentModelSelectionId);
  const createConversation = useAiStore((s) => s.createConversation);
  const replaceConversationMessages = useAiStore((s) => s.replaceConversationMessages);

  const providers = useAiModelsStore((s) => s.providers);

  const abortRef = useRef<AbortController | null>(null);
  const currentInlineRef = useRef<InlineTerminalAiTarget | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);
  const threadMessagesRef = useRef<ThreadMessage[]>([]);
  threadMessagesRef.current = threadMessages;

  useEffect(() => {
    if (currentModelSelectionId && resolveModelSelection(providers, currentModelSelectionId)) {
      return;
    }
    const configured = useSettingsStore.getState().aiScenarioAssistantModelSelectionId;
    const resolved = resolveScenarioModelSelectionId(providers, configured);
    if (resolved) setCurrentModelSelectionId(resolved);
  }, [currentModelSelectionId, providers, setCurrentModelSelectionId]);

  useEffect(() => {
    if (!activeConversation) {
      setThreadMessages([]);
      return;
    }
    setThreadMessages(aiMessagesToThreadMessages(activeConversation.messages));
  }, [activeConversation]);

  const getModelConfig = useCallback((): ModelConfig | null => {
    const selectionId = currentModelSelectionId;
    if (!selectionId || !resolveModelSelection(providers, selectionId)) {
      const configured = useSettingsStore.getState().aiScenarioAssistantModelSelectionId;
      const fallback = resolveScenarioModelSelectionId(providers, configured);
      if (!fallback) return null;
      setCurrentModelSelectionId(fallback);
      const resolved = resolveModelSelection(providers, fallback);
      if (!resolved) return null;
      return resolved;
    }
    const resolved = resolveModelSelection(providers, selectionId);
    if (!resolved) return null;
    return resolved;
  }, [currentModelSelectionId, providers, setCurrentModelSelectionId]);

  const getPriorMessages = useCallback(
    (convId: string) => {
      const conv = useAiStore.getState().conversations.find((c) => c.id === convId);
      if (!conv) return [];
      return conv.messages.slice(-20).map((m) => ({
        role: m.role,
        content: m.content,
        toolCalls: m.toolCalls?.map((tc) => ({
          id: tc.id,
          name: tc.name,
          arguments: tc.arguments,
          result: tc.result,
        })),
      }));
    },
    [],
  );

  const handleSetMessages = useCallback(
    (messages: readonly ThreadMessage[]) => {
      const next = [...messages];
      setThreadMessages(next);
      const convId = activeConversationId;
      if (!convId) return;
      replaceConversationMessages(convId, threadMessagesToAiMessages(next));
    },
    [activeConversationId, replaceConversationMessages],
  );

  const runGenerationRef =
    useRef<
      (
        convId: string | null,
        assistantMsgId: string | null,
        priorMessages: ReturnType<typeof getPriorMessages>,
        modelConfig: ModelConfig,
        inline?: InlineTerminalAiTarget,
      ) => Promise<void>
    >(undefined);

  runGenerationRef.current = async (
    convId,
    assistantMsgId,
    priorMessages,
    modelConfig,
    inline,
  ) => {
    const appendText = (chunk: string) => {
      if (inline?.assistantTurnId) {
        useBlocksStore
          .getState()
          .appendAiThreadMessageField(
            inline.blockId,
            inline.assistantTurnId,
            "content",
            chunk,
          );
      } else if (convId && assistantMsgId) {
        appendStreamContent(convId, assistantMsgId, chunk);
      }
    };
    const appendReasoning = (chunk: string) => {
      if (inline?.assistantTurnId) {
        useBlocksStore
          .getState()
          .appendAiThreadMessageField(
            inline.blockId,
            inline.assistantTurnId,
            "reasoning",
            chunk,
          );
      } else if (convId && assistantMsgId) {
        appendStreamReasoning(convId, assistantMsgId, chunk);
      }
    };
    setIsGenerating(true);
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;
    currentInlineRef.current = inline ?? null;

    let lastActivityAt = Date.now();
    const stallTimer = window.setInterval(() => {
      if (signal.aborted) return;
      if (Date.now() - lastActivityAt > GENERATION_STALL_MS) {
        abortRef.current?.abort();
      }
    }, 3_000);

    const touchActivity = () => {
      lastActivityAt = Date.now();
    };

    const finishGeneration = (failed = false, aborted = false) => {
      if (inline) {
        if (aborted) {
          finalizeInlineBlock(inline, {
            failed: true,
            aborted: true,
            reason: "已停止",
          });
        } else {
          finalizeInlineBlock(inline, { failed });
        }
      } else if (convId && assistantMsgId) {
        updateMessage(convId, assistantMsgId, {
          isStreaming: false,
          isReasoningStreaming: false,
        });
      }
    };

    const moduleKey =
      typeof window !== "undefined"
        ? moduleKeyFromPath(window.location.pathname)
        : null;

    const toolDefs = await withTimeout(
      loadAiToolDefs(moduleKey),
      AI_TOOL_LOAD_TIMEOUT_MS,
      "加载 AI 工具超时",
    );
    setConnectedMcpServices(
      toolDefs.map((t) => ({
        serviceId: t.serviceId,
        serviceName: t.kind === "module" ? `模块:${t.moduleKey}` : t.serviceId,
        builtin: t.kind === "module",
        toolCount: 1,
      })),
    );

    try {
      const toolCallAcc = new Map<number, { id?: string; name?: string; args: string }>();
      const moduleContextText = moduleKey
        ? getModuleAiContextText(moduleKey)
        : null;

      while (true) {
        toolCallAcc.clear();

        const { apiMessages } = buildModelMessages(priorMessages, toolDefs, {
          moduleContextText,
        });

        const stream = streamModelChat(apiMessages, modelConfig, toolDefs, {
          signal,
          reasoningEffort:
            reasoningEffort !== "default" ? reasoningEffort : undefined,
        });

        for await (const chunk of stream) {
          if (signal.aborted) break;

          touchActivity();

          if (chunk.type === "text") {
            appendText(chunk.delta);
          }

          if (chunk.type === "reasoning") {
            appendReasoning(chunk.delta);
          }

          if (chunk.type === "tool-call-delta") {
            mergeToolCallDeltas(toolCallAcc, [chunk]);
          }
        }

        if (signal.aborted) break;

        const resolvedCalls = mergeToolCallDeltas(toolCallAcc, []);
        if (resolvedCalls.length === 0) break;

        for (const tc of resolvedCalls) {
          if (!inline) {
            const currentConv = useAiStore
              .getState()
              .conversations.find((c) => c.id === convId);
            const currentMsg = currentConv?.messages.find(
              (m) => m.id === assistantMsgId,
            );
            const existing = currentMsg?.toolCalls ?? [];

            if (!existing.some((e) => e.id === tc.id)) {
              appendText("");
              updateMessage(convId!, assistantMsgId!, {
                toolCalls: [
                  ...existing,
                  {
                    id: tc.id,
                    name: tc.name,
                    arguments: tc.args,
                    status: "running",
                  },
                ],
              });
            }
          }
        }

        for (const tc of resolvedCalls) {
          const toolDef = toolDefs.find(
            (t) =>
              t.originalName === tc.name ||
              `${t.serviceId}/${t.originalName}` === tc.name ||
              tc.name.includes(t.originalName),
          );

          const toolCallId = tc.id ?? newInlineToolCallId();
          let result: string;
          let success: boolean;

          if (!toolDef) {
            result = `Unknown tool: ${tc.name}`;
            success = false;
            if (inline) {
              useBlocksStore.getState().pushAiThreadItem(inline.blockId, {
                kind: "tool_call",
                id: toolCallId,
                toolName: tc.name,
                args: tc.args,
                status: "failed",
                result,
              });
            } else {
              appendText(`\n\n*${result}*`);
            }
          } else if (
            inline &&
            toolDef.kind === "module" &&
            toolDef.originalName === "run_terminal_command"
          ) {
            const created = createInlineTerminalToolCall(
              inline.blockId,
              inline.sessionId,
              toolCallId,
              tc.name,
              tc.args,
            );
            const decision = await new Promise<
              Awaited<ReturnType<typeof waitForInlineToolDecision>>
            >((resolve) => {
              const timer = window.setTimeout(() => {
                rejectInlineTerminalTool(inline.blockId, toolCallId);
                resolve({
                  approved: false,
                  result: "等待命令确认超时",
                  exitCode: 1,
                });
              }, INLINE_TOOL_DECISION_TIMEOUT_MS);

              void waitForInlineToolDecision(
                inline.blockId,
                toolCallId,
                inline.sessionId,
                created.command,
              ).then((result) => {
                window.clearTimeout(timer);
                resolve(result);
              });
            });
            result = decision.result;
            success =
              decision.approved &&
              (decision.exitCode === 0 || decision.exitCode === null);
          } else if (inline) {
            useBlocksStore.getState().pushAiThreadItem(inline.blockId, {
              kind: "tool_call",
              id: toolCallId,
              toolName: tc.name,
              args: tc.args,
              status: "running",
            });
            const executed = await executeToolCall(toolDef, tc.args);
            result = executed.result;
            success = executed.success;
            useBlocksStore.getState().updateAiThreadItem(inline.blockId, toolCallId, {
              status: success ? "completed" : "failed",
              result,
            });
          } else {
            const executed = await executeToolCall(toolDef, tc.args);
            result = executed.result;
            success = executed.success;
            if (convId && assistantMsgId) {
              updateMessage(convId, assistantMsgId, {
                toolCalls: useAiStore
                  .getState()
                  .conversations.find((c) => c.id === convId)
                  ?.messages.find((m) => m.id === assistantMsgId)
                  ?.toolCalls?.map((t) =>
                    t.id === tc.id
                      ? { ...t, status: success ? "completed" : "failed", result }
                      : t,
                  ),
              });
            }
          }

          priorMessages.push({
            role: "assistant",
            content: "",
            toolCalls: [{ id: toolCallId, name: tc.name, arguments: tc.args, result: undefined }],
          });
          priorMessages.push({
            role: "tool",
            content: result,
            toolCalls: [{ id: toolCallId, name: tc.name, arguments: tc.args, result: undefined }],
          });
        }
      }

      finishGeneration();
    } catch (err) {
      if (signal.aborted) {
        finishGeneration(true, true);
      } else {
        const message = err instanceof Error ? err.message : String(err);
        appendText(`\n\nError: ${message}`);
        if (inline && !inlineHasAssistantContent(inline.blockId)) {
          pushAssistantErrorMessage(inline.blockId, message || "AI 请求失败");
        }
        finishGeneration(true);
      }
    } finally {
      window.clearInterval(stallTimer);
      setIsGenerating(false);
      abortRef.current = null;
      currentInlineRef.current = null;
    }
  };

  const onNewRef = useRef<(message: AppendMessage) => Promise<void>>(undefined);
  const onReloadRef = useRef<(parentId: string | null) => Promise<void>>(undefined);
  const runUserPromptRef =
    useRef<
      (
        userText: string,
        options?: {
          newConversation?: boolean;
          contextChips?: { type: string; label: string }[];
          inline?: InlineTerminalAiTarget;
        },
      ) => Promise<void>
    >(undefined);

  runUserPromptRef.current = async (userText, options) => {
    if (!userText.trim()) return;
    if (useAiStore.getState().isGenerating) {
      if (options?.inline) {
        abortRef.current?.abort();
        setIsGenerating(false);
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      } else {
        return;
      }
    }

    const modelConfig = getModelConfig();

    if (options?.inline) {
      const { blockId, sessionId, continueThread } = options.inline;
      if (!modelConfig) {
        pushAssistantErrorMessage(
          blockId,
          "请先在 **设置 → AI 模型** 中添加并启用至少一个模型。",
        );
        useBlocksStore.getState().updateBlock(blockId, { status: "failed", exitCode: 1 });
        return;
      }
      if (!isTauriRuntime()) {
        pushAssistantErrorMessage(blockId, "AI 助手需要在 Tauri 桌面环境中运行。");
        useBlocksStore.getState().updateBlock(blockId, { status: "failed", exitCode: 1 });
        return;
      }

      const assistantTurnId = useBlocksStore.getState().pushAiThreadItem(blockId, {
        kind: "message",
        role: "assistant",
        content: "",
        reasoning: "",
      });

      useTerminalUiStore.getState().setExpandedAiBlock(sessionId, blockId);

      const block = useBlocksStore.getState().findBlockById(blockId);
      let priorMessages: ReturnType<typeof getPriorMessages>;

      if (continueThread && block?.aiThread) {
        priorMessages = aiThreadToModelMessages(block.aiThread, {
          excludeIds: new Set([assistantTurnId]),
        }) as ReturnType<typeof getPriorMessages>;
      } else {
        priorMessages = [{ role: "user" as const, content: userText, toolCalls: undefined }];
      }

      const inlineTarget: InlineTerminalAiTarget = {
        sessionId,
        blockId,
        continueThread,
        assistantTurnId,
      };

      await runGenerationRef.current!(
        null,
        null,
        priorMessages,
        modelConfig,
        inlineTarget,
      );
      return;
    }

    let convId = options?.newConversation
      ? null
      : useAiStore.getState().activeConversationId;
    if (!convId) {
      convId = createConversation();
    }

    if (options?.contextChips) {
      for (const chip of options.contextChips) {
        useAiStore.getState().addContext(convId, chip);
      }
    }

    if (!modelConfig) {
      addMessage(convId, { role: "user", content: userText });
      addMessage(convId, {
        role: "assistant",
        content: "请先在 **设置 → AI 模型** 中添加并启用至少一个模型。",
      });
      return;
    }

    if (!isTauriRuntime()) {
      addMessage(convId, { role: "user", content: userText });
      addMessage(convId, {
        role: "assistant",
        content:
          "AI 助手需要在 Tauri 桌面环境中运行，并先在设置中配置 AI 模型。",
      });
      return;
    }

    addMessage(convId, { role: "user", content: userText });

    const assistantMsgId = addMessage(convId, {
      role: "assistant",
      content: "",
      isStreaming: true,
      isReasoningStreaming: true,
    });

    const priorMessages = getPriorMessages(convId);
    await runGenerationRef.current!(convId, assistantMsgId, priorMessages, modelConfig);
  };

  onNewRef.current = async (msg: AppendMessage) => {
    await runUserPromptRef.current!(extractUserContent(msg));
  };

  onReloadRef.current = async (parentId) => {
    if (!parentId || isGenerating) return;

    let convId = activeConversationId;
    if (!convId) return;

    const modelConfig = getModelConfig();
    if (!modelConfig || !isTauriRuntime()) return;

    const conv = useAiStore.getState().conversations.find((c) => c.id === convId);
    if (!conv) return;

    const parentIndex = conv.messages.findIndex((m) => m.id === parentId);
    if (parentIndex < 0) return;

    const parentMsg = conv.messages[parentIndex];
    if (parentMsg.role !== "user") return;

    const priorMessages = conv.messages.slice(0, parentIndex + 1).slice(-20).map((m) => ({
      role: m.role,
      content: m.content,
      toolCalls: m.toolCalls?.map((tc) => ({
        id: tc.id,
        name: tc.name,
        arguments: tc.arguments,
        result: tc.result,
      })),
    }));

    const assistantMsgId = addMessage(convId, {
      role: "assistant",
      content: "",
      isStreaming: true,
      isReasoningStreaming: true,
    });

    await runGenerationRef.current!(convId, assistantMsgId, priorMessages, modelConfig);
  };

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    setIsGenerating(false);
  }, []);

  useEffect(() => {
    return registerAiPromptSubmit((prompt, options) =>
      runUserPromptRef.current!(prompt, options),
    );
  }, []);

  useEffect(() => {
    return registerAiGenerationCancel(handleCancel);
  }, [handleCancel]);

  const adapter = useMemo<ExternalStoreAdapter>(
    () => ({
      messages: threadMessages.length > 0 ? threadMessages : EMPTY_MESSAGE_LIST,
      isRunning: isGenerating,
      onNew: (msg) => onNewRef.current!(msg),
      setMessages: handleSetMessages,
      onReload: (parentId) => onReloadRef.current!(parentId),
      onCancel: handleCancel,
    }),
    [threadMessages, isGenerating, handleCancel, handleSetMessages],
  );

  const runtime = useExternalStoreRuntime(adapter);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
