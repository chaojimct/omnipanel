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

export interface ResolvedCliBackend {
  backendId: string;
  providerId: string;
  modelId: string;
}

export interface ResolvedAcpBackend {
  backendId: string;
  agentKind: string;
}

export type ResolvedBackend =
  | ({ kind: "http" } & ResolvedHttpBackend)
  | ({ kind: "cli" } & ResolvedCliBackend)
  | ({ kind: "acp" } & ResolvedAcpBackend);

export function isAcpBackendId(backendId: string): boolean {
  return backendId.startsWith("acp:");
}

export function isCliBackendId(backendId: string): boolean {
  return backendId.startsWith("cli:");
}

export function isStructuredBackendId(id: string): boolean {
  return id.startsWith("http:") || id.startsWith("cli:") || id.startsWith("acp:");
}

/** 构建 `cli:{providerId}::{modelName}` backend_id。 */
export function buildCliBackendId(providerId: string, modelName: string): string {
  return `cli:${providerId}::${modelName}`;
}

/** 构建 `acp:{agentKind}` backend_id（遗留别名）。 */
export function buildAcpBackendId(agentKind: string): string {
  return `acp:${agentKind}`;
}

/** 构建 `http:{providerId}::{modelName}` backend_id。 */
export function buildHttpBackendId(providerId: string, modelName: string): string {
  return `http:${providerId}::${modelName}`;
}

export function parseCliBackendId(backendId: string): { providerId: string; modelId: string } | null {
  if (!isCliBackendId(backendId)) return null;
  const rest = backendId.slice("cli:".length);
  const sep = rest.lastIndexOf("::");
  if (sep < 0) return null;
  return {
    providerId: rest.slice(0, sep),
    modelId: rest.slice(sep + 2),
  };
}

export function resolveHttpBackendFromSelection(
  providers: AiModelProvider[],
  selectionId: string | null | undefined,
): ResolvedHttpBackend | null {
  if (!selectionId || isAcpBackendId(selectionId) || isCliBackendId(selectionId)) return null;
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

export function resolveBackendFromSelection(
  providers: AiModelProvider[],
  selectionId: string | null | undefined,
): ResolvedBackend | null {
  if (!selectionId) return null;
  if (isCliBackendId(selectionId)) {
    const parsed = parseCliBackendId(selectionId);
    if (!parsed) return null;
    return {
      kind: "cli",
      backendId: selectionId,
      providerId: parsed.providerId,
      modelId: parsed.modelId,
    };
  }
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
