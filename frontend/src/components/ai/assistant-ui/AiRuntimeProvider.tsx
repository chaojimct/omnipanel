import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import type {
  AppendMessage,
  ExternalStoreAdapter,
  ThreadAssistantMessage,
  ThreadMessage,
  ThreadUserMessage,
} from "@assistant-ui/react";
import { useExternalStoreRuntime } from "@assistant-ui/react";

import { commands } from "../../../ipc/bindings";
import {
  firstModelSelectionId,
  resolveModelSelection,
  useAiModelsStore,
} from "../../../stores/aiModelsStore";
import { useAiStore } from "../../../stores/aiStore";

import {
  buildModelMessages,
  mergeToolCallDeltas,
  streamModelChat,
  type ModelConfig,
  type StreamChunk,
} from "./chatModel";

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

let idCounter = 0;
function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${++idCounter}`;
}

function toThreadUserMessage(content: string): ThreadUserMessage {
  return {
    id: genId("user"),
    role: "user",
    createdAt: new Date(),
    content: [{ type: "text", text: content }],
    attachments: [],
    metadata: {
      custom: {},
    },
  };
}

function buildAssistantMessage(
  id: string,
  text: string,
  reasoningText?: string,
  toolCalls?: { id: string; name: string; args: string; result?: string; status?: string }[],
  status?: { type: "running" } | { type: "complete"; reason: "stop" },
): ThreadAssistantMessage {
  const parts: ThreadAssistantMessage["content"] = [];

  if (reasoningText) {
    parts.push({ type: "reasoning", text: reasoningText } as ThreadAssistantMessage["content"][0]);
  }

  if (text) {
    parts.push({ type: "text", text } as ThreadAssistantMessage["content"][0]);
  }

  if (toolCalls?.length) {
    for (const tc of toolCalls) {
      parts.push({
        type: "tool-call",
        toolCallId: tc.id,
        toolName: tc.name,
        args: safeParseJson(tc.args),
        argsText: tc.args,
        ...(tc.result !== undefined
          ? { result: tc.result, isError: tc.status === "failed" }
          : {}),
      } as unknown as ThreadAssistantMessage["content"][0]);
    }
  }

  return {
    id,
    role: "assistant",
    createdAt: new Date(),
    status: status ?? { type: "running" },
    content: parts,
    metadata: {
      custom: {},
      unstable_state: null,
      unstable_annotations: [],
      unstable_data: [],
      steps: [],
    },
  };
}

function safeParseJson(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function convertToAiStoreRole(role: string): "user" | "assistant" | "tool" {
  if (role === "user") return "user";
  return "assistant";
}

function extractUserContent(threadMessage: ThreadMessage): string {
  for (const part of threadMessage.content) {
    if (part.type === "text") return part.text;
  }
  return "";
}

interface MpcToolDef {
  serviceId: string;
  originalName: string;
  description: string;
}

async function loadMcpToolDefs(): Promise<MpcToolDef[]> {
  if (!isTauriRuntime()) return [];
  const listResult = await commands.mcpListServices();
  if (listResult.status !== "ok") return [];

  const running = listResult.data.filter((s) => s.status === "running");
  const defs: MpcToolDef[] = [];

  for (const service of running) {
    const toolsResult = await commands.mcpListServiceTools(service.id);
    if (toolsResult.status !== "ok") continue;
    for (const tool of toolsResult.data) {
      defs.push({
        serviceId: service.id,
        originalName: tool.name,
        description: tool.description ?? tool.name,
      });
    }
  }

  return defs;
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

  const providers = useAiModelsStore((s) => s.providers);

  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);
  const threadMessagesRef = useRef<ThreadMessage[]>([]);
  threadMessagesRef.current = threadMessages;

  useEffect(() => {
    if (currentModelSelectionId) return;
    const first = firstModelSelectionId(providers);
    if (first) setCurrentModelSelectionId(first);
  }, [currentModelSelectionId, providers, setCurrentModelSelectionId]);

  useEffect(() => {
    if (!activeConversation) {
      setThreadMessages([]);
      return;
    }

    const converted: ThreadMessage[] = [];
    for (const msg of activeConversation.messages) {
      if (msg.role === "user") {
        converted.push(toThreadUserMessage(msg.content));
      } else if (msg.role === "assistant") {
        const isStreaming = msg.isStreaming || false;
        converted.push(
          buildAssistantMessage(
            msg.id,
            msg.content,
            msg.reasoningContent,
            msg.toolCalls?.map((tc) => ({
              id: tc.id,
              name: tc.name,
              args: tc.arguments,
              result: tc.result,
              status: tc.status,
            })),
            isStreaming ? { type: "running" } : { type: "complete", reason: "stop" },
          ),
        );
      }
    }
    setThreadMessages(converted);
  }, [activeConversation]);

  const getModelConfig = useCallback((): ModelConfig | null => {
    const selectionId = currentModelSelectionId;
    if (!selectionId) {
      const first = firstModelSelectionId(providers);
      if (!first) return null;
      setCurrentModelSelectionId(first);
      const resolved = resolveModelSelection(providers, first);
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
        })),
      }));
    },
    [],
  );

  const onNewRef = useRef<(message: AppendMessage) => Promise<void>>();

  onNewRef.current = async (msg: AppendMessage) => {
    const userText = extractUserContent(msg);
    if (!userText.trim()) return;
    if (isGenerating) return;

    let convId = activeConversationId;
    if (!convId) {
      convId = createConversation();
    }

    const modelConfig = getModelConfig();
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

    setIsGenerating(true);
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    const priorMessages = getPriorMessages(convId);
    const toolDefs = await loadMcpToolDefs();
    setConnectedMcpServices(
      toolDefs.map((t) => ({
        serviceId: t.serviceId,
        serviceName: t.serviceId,
        builtin: false,
        toolCount: 1,
      })),
    );

    try {
      let accumulatedText = "";
      let accumulatedReasoning = "";
      const toolCallAcc = new Map<number, { id?: string; name?: string; args: string }>();
      let toolCallsEmitted = false;

      while (true) {
        const { apiMessages } = buildModelMessages(
          priorMessages,
          toolDefs,
        );

        const stream = streamModelChat(apiMessages, modelConfig, toolDefs, {
          signal,
          reasoningEffort:
            reasoningEffort !== "default" ? reasoningEffort : undefined,
        });

        toolCallsEmitted = false;

        for await (const chunk of stream) {
          if (signal.aborted) break;

          if (chunk.type === "text") {
            accumulatedText += chunk.delta;
            appendStreamContent(convId, assistantMsgId, chunk.delta);
          }

          if (chunk.type === "reasoning") {
            accumulatedReasoning += chunk.delta;
            appendStreamReasoning(convId, assistantMsgId, chunk.delta);
          }

          if (chunk.type === "tool-call-delta") {
            mergeToolCallDeltas(toolCallAcc, [chunk]);
            toolCallsEmitted = true;
          }
        }

        if (signal.aborted) break;

        const resolvedCalls = mergeToolCallDeltas(toolCallAcc, []);

        if (resolvedCalls.length === 0) break;

        for (const tc of resolvedCalls) {
          const currentConv = useAiStore
            .getState()
            .conversations.find((c) => c.id === convId);
          const currentMsg = currentConv?.messages.find(
            (m) => m.id === assistantMsgId,
          );
          const existing = currentMsg?.toolCalls ?? [];

          if (!existing.some((e) => e.id === tc.id)) {
            appendStreamContent(convId, assistantMsgId, "");
            updateMessage(convId, assistantMsgId, {
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

        for (const tc of resolvedCalls) {
          const toolDef = toolDefs.find(
            (t) =>
              t.originalName === tc.name ||
              `${t.serviceId}/${t.originalName}` === tc.name ||
              tc.name.includes(t.originalName),
          );

          if (!toolDef) {
            appendStreamContent(
              convId,
              assistantMsgId,
              `\n\n*Unknown tool: ${tc.name}*`,
            );
            updateMessage(convId, assistantMsgId, {
              toolCalls: useAiStore
                .getState()
                .conversations.find((c) => c.id === convId)
                ?.messages.find((m) => m.id === assistantMsgId)
                ?.toolCalls?.map((t) =>
                  t.id === tc.id ? { ...t, status: "failed", result: "Tool not found" } : t,
                ),
            });
            continue;
          }

          const { result, success } = await executeMcpTool(
            toolDef.serviceId,
            toolDef.originalName,
            tc.args,
          );

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

          priorMessages.push({
            role: "assistant",
            content: "",
            toolCalls: [
              { id: tc.id, name: tc.name, arguments: tc.args },
            ],
          });
          priorMessages.push({
            role: "tool",
            content: result,
            toolCalls: [tc],
          });
        }
      }

      updateMessage(convId, assistantMsgId, {
        isStreaming: false,
        isReasoningStreaming: false,
      });
    } catch (err) {
      if (signal.aborted) {
        updateMessage(convId, assistantMsgId, {
          isStreaming: false,
          isReasoningStreaming: false,
        });
      } else {
        appendStreamContent(
          convId,
          assistantMsgId,
          `\n\nError: ${err instanceof Error ? err.message : String(err)}`,
        );
        updateMessage(convId, assistantMsgId, {
          isStreaming: false,
          isReasoningStreaming: false,
        });
      }
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  };

  const handleCancel = useCallback(async () => {
    abortRef.current?.abort();
  }, []);

  const adapter = useMemo<ExternalStoreAdapter>(
    () => ({
      messages: threadMessages.length > 0 ? threadMessages : EMPTY_MESSAGE_LIST,
      isRunning: isGenerating,
      onNew: (msg) => onNewRef.current!(msg),
      onCancel: handleCancel,
    }),
    [threadMessages, isGenerating, handleCancel],
  );

  const runtime = useExternalStoreRuntime(adapter);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
