import { commands } from "../../ipc/bindings";
import type { EmbeddingProviderConfig } from "../../ipc/bindings";
import {
  clampKnowledgeChunkOverlap,
  clampKnowledgeChunkSize,
} from "../../stores/settingsStore";

type KnowledgeVectorizeSettings = {
  knowledgeChunkSize: number;
  knowledgeChunkOverlap: number;
};

export async function vectorizeKnowledgeEntry(
  entryId: string,
  provider: EmbeddingProviderConfig,
  knowledgeSettings: KnowledgeVectorizeSettings,
): Promise<{ ok: true; chunkCount: number } | { ok: false; error: string }> {
  if (provider.apiStandard.toLowerCase() === "anthropic") {
    return { ok: false, error: "Anthropic 模型暂不支持 embedding，请选用 OpenAI 兼容模型" };
  }
  if (!provider.modelName.trim()) {
    return { ok: false, error: "未配置 Embedding 模型名称" };
  }
  if (!provider.baseUrl.trim()) {
    return { ok: false, error: "未配置 Embedding API Base URL" };
  }

  const chunkSize = clampKnowledgeChunkSize(knowledgeSettings.knowledgeChunkSize);
  const chunkOverlap = clampKnowledgeChunkOverlap(
    knowledgeSettings.knowledgeChunkOverlap,
    chunkSize,
  );

  const res = await commands.knowledgeVectorize({
    entryId,
    provider: {
      providerId: provider.providerId,
      modelName: provider.modelName.trim(),
      baseUrl: provider.baseUrl.trim(),
      apiKey: provider.apiKey.trim(),
      apiStandard: provider.apiStandard,
    },
    chunkSize,
    chunkOverlap,
  });

  if (res.status === "ok") {
    return { ok: true, chunkCount: res.data.chunkCount ?? 0 };
  }
  return { ok: false, error: res.error.message };
}

export const KNOWLEDGE_VECTORIZED_EVENT = "omnipanel:knowledge-vectorized";

export function dispatchKnowledgeVectorized(entryId: string) {
  window.dispatchEvent(
    new CustomEvent(KNOWLEDGE_VECTORIZED_EVENT, { detail: { entryId } }),
  );
}

export async function loadKnowledgeVectorStatus(entryId: string) {
  const res = await commands.knowledgeVectorStatus(entryId);
  if (res.status === "ok") {
    return res.data;
  }
  throw new Error(res.error.message);
}
