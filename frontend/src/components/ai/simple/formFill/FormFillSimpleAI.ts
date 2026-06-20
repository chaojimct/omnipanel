import type { ClipboardSnapshot } from "../../../../lib/readLatestClipboard";
import type { OmniModelConfig } from "../../langchain/createOmniAgent";
import {
  firstModelSelectionId,
  resolveModelSelection,
  type AiModelProvider,
} from "../../../../stores/aiModelsStore";
import { runSimpleChat, type SimpleChatContentPart } from "../runSimpleChat";
import type {
  FormFillFieldDef,
  FormFillSimpleAIInput,
  FormFillSimpleAIResult,
  FormFillValue,
} from "./types";

/** 表单填充专用系统提示词（留空，由业务方自行填写）。 */
export const FORM_FILL_SIMPLE_AI_SYSTEM_PROMPT = ``;

export type { FormFillFieldDef, FormFillSimpleAIInput, FormFillSimpleAIResult, FormFillValue };

export interface RunFormFillSimpleAIOptions {
  signal?: AbortSignal;
  /** 覆盖默认系统提示词 */
  systemPrompt?: string;
}

function buildUserPrompt(input: FormFillSimpleAIInput): string {
  const lines = [
    "## 表单字段定义",
    "```json",
    JSON.stringify(input.fields, null, 2),
    "```",
    "",
    "## 待识别内容",
    input.sourceText.trim() || "(无文本)",
  ];
  if (input.context?.trim()) {
    lines.push("", "## 补充说明", input.context.trim());
  }
  lines.push(
    "",
    "## 输出要求",
    "- 仅输出一个 JSON 对象，键为字段 key，值为识别结果",
    "- 无法确定的可选字段使用 null",
    "- 不要输出 Markdown 代码块或其它说明文字",
  );
  return lines.join("\n");
}

function buildUserContent(input: FormFillSimpleAIInput): string | SimpleChatContentPart[] {
  const text = buildUserPrompt(input);
  if (!input.imageUrl) return text;
  return [
    { type: "text", text },
    { type: "image_url", image_url: { url: input.imageUrl } },
  ];
}

function parseJsonObject(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonStr = fenceMatch ? fenceMatch[1].trim() : trimmed;
  const parsed = JSON.parse(jsonStr) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("FORM_FILL_INVALID_JSON");
  }
  return parsed as Record<string, unknown>;
}

function coerceFieldValue(
  raw: unknown,
  field: FormFillFieldDef,
): FormFillValue {
  if (raw === null || raw === undefined || raw === "") {
    return field.required ? "" : null;
  }
  switch (field.type) {
    case "number": {
      if (typeof raw === "number" && Number.isFinite(raw)) return raw;
      const n = Number(String(raw).trim());
      return Number.isFinite(n) ? n : null;
    }
    case "boolean": {
      if (typeof raw === "boolean") return raw;
      const s = String(raw).trim().toLowerCase();
      if (["true", "1", "yes", "y", "是"].includes(s)) return true;
      if (["false", "0", "no", "n", "否"].includes(s)) return false;
      return null;
    }
    default:
      return String(raw);
  }
}

function normalizeValues(
  raw: Record<string, unknown>,
  fields: FormFillFieldDef[],
): Record<string, FormFillValue> {
  const values: Record<string, FormFillValue> = {};
  for (const field of fields) {
    values[field.key] = coerceFieldValue(raw[field.key], field);
  }
  return values;
}

/** 根据剪贴板快照构造表单填充输入；无可用内容时返回 null。 */
export function formFillInputFromClipboard(
  snapshot: ClipboardSnapshot | null,
  fields: FormFillFieldDef[],
  context?: string,
): FormFillSimpleAIInput | null {
  if (!snapshot) return null;
  if (snapshot.kind === "text") {
    const text = snapshot.text.trim();
    if (!text) return null;
    return { sourceText: text, fields, context };
  }
  return {
    sourceText: "",
    imageUrl: snapshot.src,
    fields,
    context,
  };
}

/** 解析当前可用的表单填充模型配置。 */
export function resolveFormFillModelConfig(
  providers: AiModelProvider[],
  selectionId?: string | null,
): OmniModelConfig | null {
  const resolvedId =
    selectionId && resolveModelSelection(providers, selectionId)
      ? selectionId
      : firstModelSelectionId(providers);
  if (!resolvedId) return null;
  return resolveModelSelection(providers, resolvedId);
}

/**
 * 表单填充简单 AI：根据用户提供的文本/图片，输出与字段定义匹配的结构化 JSON。
 * 主要用于 FormDialog 剪贴板识别等场景。
 */
export async function runFormFillSimpleAI(
  modelConfig: OmniModelConfig,
  input: FormFillSimpleAIInput,
  options?: RunFormFillSimpleAIOptions,
): Promise<FormFillSimpleAIResult> {
  if (!input.fields.length) {
    throw new Error("FORM_FILL_NO_FIELDS");
  }
  if (!input.sourceText.trim() && !input.imageUrl) {
    throw new Error("FORM_FILL_NO_SOURCE");
  }

  const raw = await runSimpleChat(
    modelConfig,
    options?.systemPrompt ?? FORM_FILL_SIMPLE_AI_SYSTEM_PROMPT,
    buildUserContent(input),
    { signal: options?.signal },
  );

  if (!raw) {
    throw new Error("FORM_FILL_EMPTY_RESPONSE");
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = parseJsonObject(raw);
  } catch {
    throw new Error("FORM_FILL_PARSE_FAILED");
  }

  return {
    values: normalizeValues(parsed, input.fields),
    raw,
  };
}
