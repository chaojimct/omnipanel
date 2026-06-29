import type { EmbeddingProviderConfig } from "../ipc/bindings";
import {
  isValidBaseUrl,
  listModelSelections,
  parseModelSelectionId,
  resolveModelSelection,
  type AiModelProvider,
} from "../stores/aiModelsStore";

export type KnowledgeEmbeddingModelMode = "configured" | "custom";

export interface KnowledgeEmbeddingCustomModel {
  modelName: string;
  baseUrl: string;
  apiKey: string;
}

export const KNOWLEDGE_EMBEDDING_CUSTOM_PROVIDER_ID = "embedding-custom";

export const DEFAULT_KNOWLEDGE_EMBEDDING_CUSTOM_MODEL: KnowledgeEmbeddingCustomModel = {
  modelName: "text-embedding-3-small",
  baseUrl: "https://api.openai.com/v1",
  apiKey: "",
};

export type KnowledgeEmbeddingSettingsSlice = {
  knowledgeEmbeddingModelMode: KnowledgeEmbeddingModelMode;
  knowledgeEmbeddingModelSelectionId: string | null;
  knowledgeEmbeddingCustomModel: KnowledgeEmbeddingCustomModel;
};

export function isKnowledgeEmbeddingCustomModelReady(
  custom: KnowledgeEmbeddingCustomModel,
): boolean {
  return custom.modelName.trim().length > 0 && isValidBaseUrl(custom.baseUrl);
}

export function resolveConfiguredEmbeddingSelectionId(
  providers: AiModelProvider[],
  selectionId: string | null,
): string | null {
  const options = listModelSelections(providers);
  if (options.length === 0) {
    return null;
  }
  if (selectionId && options.some((item) => item.id === selectionId)) {
    return selectionId;
  }
  return options[0]!.id;
}

export function resolveKnowledgeEmbeddingProvider(
  providers: AiModelProvider[],
  settings: KnowledgeEmbeddingSettingsSlice,
): EmbeddingProviderConfig | null {
  if (settings.knowledgeEmbeddingModelMode === "custom") {
    const custom = settings.knowledgeEmbeddingCustomModel;
    if (!isKnowledgeEmbeddingCustomModelReady(custom)) {
      return null;
    }
    return {
      providerId: KNOWLEDGE_EMBEDDING_CUSTOM_PROVIDER_ID,
      modelName: custom.modelName.trim(),
      baseUrl: custom.baseUrl.trim(),
      apiKey: custom.apiKey.trim(),
      apiStandard: "openai",
    };
  }

  const selectionId = resolveConfiguredEmbeddingSelectionId(
    providers,
    settings.knowledgeEmbeddingModelSelectionId,
  );
  if (!selectionId) {
    return null;
  }
  const resolved = resolveModelSelection(providers, selectionId);
  if (!resolved) {
    return null;
  }
  if (resolved.apiStandard === "anthropic") {
    return null;
  }
  const parsed = parseModelSelectionId(selectionId);
  if (!parsed) {
    return null;
  }
  return {
    providerId: parsed.providerId,
    modelName: resolved.name,
    baseUrl: resolved.baseUrl,
    apiKey: resolved.apiKey,
    apiStandard: resolved.apiStandard,
  };
}
