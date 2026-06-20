import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import type { OmniModelConfig } from "../langchain/createOmniAgent";
import { getOmniChatModel } from "../langchain/createOmniAgent";

export type SimpleChatContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export interface RunSimpleChatOptions {
  signal?: AbortSignal;
}

function extractMessageContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text: string }).text);
        }
        return "";
      })
      .join("");
  }
  return String(content ?? "");
}

/** 单次 LLM 调用（无 Agent / 工具），用于简单结构化任务。 */
export async function runSimpleChat(
  modelConfig: OmniModelConfig,
  systemPrompt: string,
  userContent: string | SimpleChatContentPart[],
  options?: RunSimpleChatOptions,
): Promise<string> {
  const model = await getOmniChatModel(modelConfig);
  const response = await model.invoke(
    [new SystemMessage(systemPrompt), new HumanMessage(userContent)],
    { signal: options?.signal },
  );
  return extractMessageContent(response.content).trim();
}
