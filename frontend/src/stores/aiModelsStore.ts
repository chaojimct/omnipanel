import { create } from "zustand";
import { persist } from "zustand/middleware";

/** 用户自定义的 AI 模型接入方式 */
export type ApiStandard = "openai" | "anthropic";

export interface AiModelConfig {
  id: string;
  /** 用户在界面上看到的模型名（可重复） */
  name: string;
  /** API 标准：决定请求体格式与默认 BaseURL */
  apiStandard: ApiStandard;
  /** 接口 Base URL（去掉末尾斜杠后保存） */
  baseUrl: string;
  /** API Key（在 UI 中掩码显示） */
  apiKey: string;
  /** 创建时间（毫秒） */
  createdAt: number;
}

interface AiModelsState {
  models: AiModelConfig[];
  addModel: (input: Omit<AiModelConfig, "id" | "createdAt">) => AiModelConfig;
  removeModel: (id: string) => void;
  updateModel: (id: string, patch: Partial<Omit<AiModelConfig, "id" | "createdAt">>) => void;
  resetModels: () => void;
}

let idCounter = 0;
function genId(): string {
  return `model_${Date.now()}_${++idCounter}`;
}

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

export const useAiModelsStore = create<AiModelsState>()(
  persist(
    (set) => ({
      models: [],
      addModel: (input) => {
        const model: AiModelConfig = {
          id: genId(),
          name: input.name.trim(),
          apiStandard: input.apiStandard,
          baseUrl: normalizeBaseUrl(input.baseUrl),
          apiKey: input.apiKey.trim(),
          createdAt: Date.now(),
        };
        set((s) => ({ models: [model, ...s.models] }));
        return model;
      },
      removeModel: (id) =>
        set((s) => ({ models: s.models.filter((m) => m.id !== id) })),
      updateModel: (id, patch) =>
        set((s) => ({
          models: s.models.map((m) =>
            m.id === id
              ? {
                  ...m,
                  ...patch,
                  ...(patch.baseUrl !== undefined
                    ? { baseUrl: normalizeBaseUrl(patch.baseUrl) }
                    : {}),
                  ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
                  ...(patch.apiKey !== undefined ? { apiKey: patch.apiKey.trim() } : {}),
                }
              : m
          ),
        })),
      resetModels: () => set({ models: [] }),
    }),
    {
      name: "omnipanel-ai-models",
      version: 1,
    }
  )
);

/** 掩码显示 API Key：仅保留最后 4 个可见字符 */
export function maskApiKey(key: string): string {
  if (!key) return "";
  if (key.length <= 4) return "•".repeat(key.length);
  return `••••${key.slice(-4)}`;
}

/** 根据 API 标准推断的默认 BaseURL */
export function defaultBaseUrlFor(standard: ApiStandard): string {
  switch (standard) {
    case "openai":
      return "https://api.openai.com/v1";
    case "anthropic":
      return "https://api.anthropic.com";
    default:
      return "";
  }
}

/** 简单的 URL 合法性校验 */
export function isValidBaseUrl(url: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** 在 model.name 内查找（不区分大小写），返回冲突的模型（不含自身 id） */
export function findNameConflict(
  models: AiModelConfig[],
  name: string,
  excludeId?: string
): AiModelConfig | null {
  const lower = name.trim().toLowerCase();
  if (!lower) return null;
  return (
    models.find(
      (m) => m.id !== excludeId && m.name.toLowerCase() === lower
    ) ?? null
  );
}
