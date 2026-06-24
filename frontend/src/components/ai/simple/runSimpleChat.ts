import { streamOpenAI, type ModelConfig } from "../assistant-ui/chatModel";

export type SimpleChatContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export interface RunSimpleChatOptions {
  signal?: AbortSignal;
}

function buildApiMessages(
  systemPrompt: string,
  userContent: string | SimpleChatContentPart[],
) {
  const messages: { role: "system" | "user" | "assistant"; content: string }[] =
    [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  if (typeof userContent === "string") {
    messages.push({ role: "user", content: userContent });
  } else {
    const textParts = userContent
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("\n");
    messages.push({ role: "user", content: textParts || "(image)" });
  }
  return messages;
}

/** 单次 LLM 调用（无 Agent / 工具），用于简单结构化任务。 */
export async function runSimpleChat(
  modelConfig: ModelConfig,
  systemPrompt: string,
  userContent: string | SimpleChatContentPart[],
  options?: RunSimpleChatOptions,
): Promise<string> {
  const messages = buildApiMessages(systemPrompt, userContent);

  let result = "";
  for await (const chunk of streamOpenAI(messages, modelConfig, [], {
    signal: options?.signal,
  })) {
    if (chunk.type === "text") {
      result += chunk.delta;
    }
  }

  return result.trim();
}
