import { useMemo } from "react";

import {
  type AiModelProvider,
} from "../stores/aiModelsStore";
import { useAiModelsStore } from "../stores/aiModelsStore";
import { useSettingsStore } from "../stores/settingsStore";
import { isStructuredBackendId } from "./ai/inferenceBackend";
import { resolveScenarioModelSelectionId } from "./aiScenarioModels";

export function resolveTerminalModelSelectionId(
  providers: AiModelProvider[],
  _sessionId?: string,
): string | null {
  const globalTerminal = useSettingsStore.getState().aiScenarioTerminalModelSelectionId?.trim();
  if (globalTerminal) {
    if (isStructuredBackendId(globalTerminal)) {
      return globalTerminal;
    }
    const fromTerminalSetting = resolveScenarioModelSelectionId(providers, globalTerminal);
    if (fromTerminalSetting) return fromTerminalSetting;
  }

  const assistantDefault = useSettingsStore.getState().aiScenarioAssistantModelSelectionId;
  return resolveScenarioModelSelectionId(providers, assistantDefault);
}

export function useTerminalModelSelectionId(): string | null {
  const providers = useAiModelsStore((s) => s.providers);
  const globalTerminal = useSettingsStore((s) => s.aiScenarioTerminalModelSelectionId);
  const assistantDefault = useSettingsStore((s) => s.aiScenarioAssistantModelSelectionId);

  return useMemo(
    () => resolveTerminalModelSelectionId(providers),
    [assistantDefault, globalTerminal, providers],
  );
}
