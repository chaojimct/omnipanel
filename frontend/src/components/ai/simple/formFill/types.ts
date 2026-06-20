/** 目标表单字段定义，用于约束 AI 结构化输出。 */
export interface FormFillFieldDef {
  /** 表单 state 键名 */
  key: string;
  /** 人类可读标签 */
  label: string;
  /** 字段说明，帮助模型理解语义 */
  description?: string;
  type?: "string" | "number" | "boolean";
  required?: boolean;
}

export interface FormFillSimpleAIInput {
  /** 待识别的原始文本 */
  sourceText: string;
  /** 可选图片（如剪贴板截图），data URL 或 http(s) URL */
  imageUrl?: string;
  /** 目标表单字段 */
  fields: FormFillFieldDef[];
  /** 额外业务上下文 */
  context?: string;
}

export type FormFillValue = string | number | boolean | null;

export interface FormFillSimpleAIResult {
  values: Record<string, FormFillValue>;
  raw: string;
}
