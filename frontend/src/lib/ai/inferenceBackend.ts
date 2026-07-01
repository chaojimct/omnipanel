import {
  parseModelSelectionId,
  resolveModelSelection,
  type AiModelProvider,
} from "../../stores/aiModelsStore";

export interface HttpProviderSnapshot {
  providerId: string;
  apiStandard: string;
  baseUrl: string;
  apiKey: string;
}

export interface ResolvedHttpBackend {
  backendId: string;
  httpProvider: HttpProviderSnapshot;
}

export interface ResolvedAcpBackend {
  backendId: string;
  agentKind: string;
}

export type ResolvedBackend =
  | ({ kind: "http" } & ResolvedHttpBackend)
  | ({ kind: "acp" } & ResolvedAcpBackend);

export function isAcpBackendId(backendId: string): boolean {
  return backendId.startsWith("acp:");
}

/** 构建 `acp:{agentKind}` backend_id。 */
export function buildAcpBackendId(agentKind: string): string {
  return `acp:${agentKind}`;
}

/** 构建 `http:{providerId}::{modelName}` backend_id。 */
export function buildHttpBackendId(providerId: string, modelName: string): string {
  return `http:${providerId}::${modelName}`;
}

/** 从 aiModelsStore 选择 id 解析 HTTP backend 与凭据快照。 */
export function resolveHttpBackendFromSelection(
  providers: AiModelProvider[],
  selectionId: string | null | undefined,
): ResolvedHttpBackend | null {
  if (!selectionId || isAcpBackendId(selectionId)) return null;
  const parsed = parseModelSelectionId(selectionId);
  if (!parsed) return null;
  const resolved = resolveModelSelection(providers, selectionId);
  if (!resolved) return null;

  return {
    backendId: buildHttpBackendId(parsed.providerId, parsed.modelName),
    httpProvider: {
      providerId: parsed.providerId,
      apiStandard: resolved.apiStandard,
      baseUrl: resolved.baseUrl,
      apiKey: resolved.apiKey,
    },
  };
}

/** 统一解析 HTTP 或 ACP backend。 */
export function resolveBackendFromSelection(
  providers: AiModelProvider[],
  selectionId: string | null | undefined,
): ResolvedBackend | null {
  if (!selectionId) return null;
  if (isAcpBackendId(selectionId)) {
    return {
      kind: "acp",
      backendId: selectionId,
      agentKind: selectionId.slice("acp:".length),
    };
  }
  const http = resolveHttpBackendFromSelection(providers, selectionId);
  if (!http) return null;
  return { kind: "http", ...http };
}
