import { z } from "zod";

import type { FormFillFieldDef } from "./types";

function fieldDescription(field: FormFillFieldDef): string {
  const parts = [field.label];
  if (field.description?.trim()) {
    parts.push(field.description.trim());
  }
  if (field.required) {
    parts.push("必填");
  }
  return parts.join("；");
}

function fieldZodType(field: FormFillFieldDef): z.ZodTypeAny {
  const desc = fieldDescription(field);
  let schema: z.ZodTypeAny;

  switch (field.type) {
    case "number":
      schema = z.number().describe(desc);
      break;
    case "boolean":
      schema = z.boolean().describe(desc);
      break;
    default:
      schema = z.string().describe(desc);
      break;
  }

  if (!field.required) {
    return schema.nullable().optional().describe(desc);
  }

  return schema;
}

/** 将动态表单字段定义转换为 Zod object schema，供 withStructuredOutput 使用。 */
export function buildFormFillZodSchema(fields: FormFillFieldDef[]): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};
  const seen = new Set<string>();

  for (const field of fields) {
    const key = field.key.trim();
    if (!key) {
      throw new Error("FORM_FILL_INVALID_FIELD_KEY");
    }
    if (seen.has(key)) {
      throw new Error("FORM_FILL_DUPLICATE_FIELD_KEY");
    }
    seen.add(key);
    shape[key] = fieldZodType(field);
  }

  return z.object(shape);
}
