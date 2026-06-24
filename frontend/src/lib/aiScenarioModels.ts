import { useMemo } from "react";

import {
  firstModelSelectionId,
  resolveModelSelection,
  type AiModelProvider,
} from "../stores/aiModelsStore";
import { useAiModelsStore } from "../stores/aiModelsStore";
import { useSettingsStore } from "../stores/settingsStore";

/** 解析场景配置的模型；无效时回退到第一个可用模型。 */
export function resolveScenarioModelSelectionId(
  providers: AiModelProvider[],
  configuredId: string | null | undefined,
): string | null {
  if (configuredId && resolveModelSelection(providers, configuredId)) {
    return configuredId;
  }
  return firstModelSelectionId(providers);
}

export function useFormFillModelSelectionId(): string | null {
  const providers = useAiModelsStore((s) => s.providers);
  const configuredId = useSettingsStore((s) => s.aiScenarioFormFillModelSelectionId);
  return useMemo(
    () => resolveScenarioModelSelectionId(providers, configuredId),
    [providers, configuredId],
  );
}

export function useAssistantScenarioModelSelectionId(): string | null {
  const providers = useAiModelsStore((s) => s.providers);
  const configuredId = useSettingsStore((s) => s.aiScenarioAssistantModelSelectionId);
  return useMemo(
    () => resolveScenarioModelSelectionId(providers, configuredId),
    [providers, configuredId],
  );
}
