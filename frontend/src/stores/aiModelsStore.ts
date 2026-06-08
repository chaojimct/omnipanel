import { create } from "zustand";
import { persist } from "zustand/middleware";

/** 用户自定义的 AI 模型接入方式 */
export type ApiStandard = "openai" | "anthropic";

/** 一个提供商配置，可包含多个模型名称 */
export interface AiModelProvider {
  id: string;
  /** 提供商显示名称 */
  providerName: string;
  /** API 标准：决定请求体格式与默认 BaseURL */
  apiStandard: ApiStandard;
  /** 接口 Base URL（去掉末尾斜杠后保存） */
  baseUrl: string;
  /** API Key（在 UI 中掩码显示） */
  apiKey: string;
  /** 该提供商下的模型名称列表 */
  modelNames: string[];
  /** 创建时间（毫秒） */
  createdAt: number;
}

/** @deprecated 旧版扁平模型结构，仅用于数据迁移 */
interface LegacyAiModelConfig {
  id: string;
  name: string;
  apiStandard: ApiStandard;
  baseUrl: string;
  apiKey: string;
  createdAt: number;
}

interface AiModelsState {
  providers: AiModelProvider[];
  addProvider: (input: Omit<AiModelProvider, "id" | "createdAt">) => AiModelProvider;
  removeProvider: (id: string) => void;
  updateProvider: (
    id: string,
    patch: Partial<Omit<AiModelProvider, "id" | "createdAt">>
  ) => void;
  resetProviders: () => void;
}

let idCounter = 0;
function genId(): string {
  return `provider_${Date.now()}_${++idCounter}`;
}

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

function normalizeProviderName(name: string): string {
  return name.trim();
}

function normalizeModelNames(names: string[]): string[] {
  return names.map((n) => n.trim()).filter(Boolean);
}

function migrateLegacyModels(models: LegacyAiModelConfig[]): AiModelProvider[] {
  const groups = new Map<
    string,
    {
      apiStandard: ApiStandard;
      baseUrl: string;
      apiKey: string;
      createdAt: number;
      modelNames: string[];
    }
  >();

  for (const model of models) {
    const key = `${model.apiStandard}\0${model.baseUrl}\0${model.apiKey}`;
    const group = groups.get(key);
    if (group) {
      group.modelNames.push(model.name);
      group.createdAt = Math.min(group.createdAt, model.createdAt);
    } else {
      groups.set(key, {
        apiStandard: model.apiStandard,
        baseUrl: model.baseUrl,
        apiKey: model.apiKey,
        createdAt: model.createdAt,
        modelNames: [model.name],
      });
    }
  }

  return Array.from(groups.values()).map((group) => ({
    id: genId(),
    providerName: group.modelNames[0] ?? "默认提供商",
    apiStandard: group.apiStandard,
    baseUrl: group.baseUrl,
    apiKey: group.apiKey,
    modelNames: group.modelNames,
    createdAt: group.createdAt,
  }));
}

export const useAiModelsStore = create<AiModelsState>()(
  persist(
    (set) => ({
      providers: [],
      addProvider: (input) => {
        const provider: AiModelProvider = {
          id: genId(),
          providerName: normalizeProviderName(input.providerName),
          apiStandard: input.apiStandard,
          baseUrl: normalizeBaseUrl(input.baseUrl),
          apiKey: input.apiKey.trim(),
          modelNames: normalizeModelNames(input.modelNames),
          createdAt: Date.now(),
        };
        set((s) => ({ providers: [provider, ...s.providers] }));
        return provider;
      },
      removeProvider: (id) =>
        set((s) => ({ providers: s.providers.filter((p) => p.id !== id) })),
      updateProvider: (id, patch) =>
        set((s) => ({
          providers: s.providers.map((p) =>
            p.id === id
              ? {
                  ...p,
                  ...patch,
                  ...(patch.providerName !== undefined
                    ? { providerName: normalizeProviderName(patch.providerName) }
                    : {}),
                  ...(patch.baseUrl !== undefined
                    ? { baseUrl: normalizeBaseUrl(patch.baseUrl) }
                    : {}),
                  ...(patch.apiKey !== undefined ? { apiKey: patch.apiKey.trim() } : {}),
                  ...(patch.modelNames !== undefined
                    ? { modelNames: normalizeModelNames(patch.modelNames) }
                    : {}),
                }
              : p
          ),
        })),
      resetProviders: () => set({ providers: [] }),
    }),
    {
      name: "omnipanel-ai-models",
      version: 2,
      migrate: (persisted, version) => {
        if (version < 2) {
          const legacy = persisted as { models?: LegacyAiModelConfig[] };
          return {
            providers: migrateLegacyModels(legacy.models ?? []),
          };
        }
        return persisted as AiModelsState;
      },
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

/** 解析逗号分隔的模型名称（去空白、去重，不区分大小写） */
export function parseModelNames(
  input: string
): { ok: true; names: string[] } | { ok: false; duplicate: string } {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const part of input.split(",")) {
    const name = part.trim();
    if (!name) continue;
    const lower = name.toLowerCase();
    if (seen.has(lower)) {
      return { ok: false, duplicate: name };
    }
    seen.add(lower);
    names.push(name);
  }
  return { ok: true, names };
}

/** 查找全局重复的模型名称 */
export function findModelNameConflict(
  providers: AiModelProvider[],
  name: string,
  excludeProviderId?: string
): { providerName: string; modelName: string } | null {
  const lower = name.trim().toLowerCase();
  if (!lower) return null;
  for (const provider of providers) {
    if (provider.id === excludeProviderId) continue;
    for (const modelName of provider.modelNames) {
      if (modelName.toLowerCase() === lower) {
        return { providerName: provider.providerName, modelName };
      }
    }
  }
  return null;
}
