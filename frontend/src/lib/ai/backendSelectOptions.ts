import { useEffect, useMemo, useState } from "react";

import { commands, type BackendInfo } from "../../ipc/bindings";
import { isTauriRuntime } from "../isTauriRuntime";
import {
  listModelSelections,
  parseModelSelectionId,
  type AiModelProvider,
} from "../../stores/aiModelsStore";

export interface BackendSelectOption {
  value: string;
  label: string;
  subtitle?: string;
  group: "http" | "acp";
  installed?: boolean;
}

/** 合并 HTTP 模型与 ACP Agent 为统一选择项（value 为 selection id 或 acp:kind）。 */
export function buildBackendSelectOptions(
  providers: AiModelProvider[],
  acpBackends: BackendInfo[] = [],
): BackendSelectOption[] {
  const httpOptions: BackendSelectOption[] = listModelSelections(providers).map(({ id }) => {
    const parsed = parseModelSelectionId(id);
    const provider = providers.find((p) => p.id === parsed?.providerId);
    const modelName = parsed?.modelName ?? id;
    const standard = provider?.apiStandard === "anthropic" ? "Anthropic" : "OpenAI";
    return {
      value: id,
      label: modelName,
      subtitle: provider ? `${provider.providerName} · ${standard}` : undefined,
      group: "http" as const,
      installed: true,
    };
  });

  const acpOptions: BackendSelectOption[] = acpBackends.map((b) => ({
      value: b.id,
      label: b.label,
      subtitle: b.installed ? "外部 Agent" : "未安装",
      group: "acp" as const,
      installed: b.installed,
    }));

  return [...httpOptions, ...acpOptions];
}

/** 拉取 ai_list_backends 并合并 HTTP + ACP 选项。 */
export function useBackendSelectOptions(providers: AiModelProvider[]) {
  const [acpBackends, setAcpBackends] = useState<BackendInfo[]>([]);

  useEffect(() => {
    if (!isTauriRuntime()) return;
    void commands
      .aiListBackends()
      .then((list) => setAcpBackends(list.filter((b) => b.kind === "acp")))
      .catch(() => setAcpBackends([]));
  }, [providers]);

  return useMemo(
    () => buildBackendSelectOptions(providers, acpBackends),
    [providers, acpBackends],
  );
}
