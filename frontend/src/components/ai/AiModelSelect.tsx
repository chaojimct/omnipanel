import { useMemo } from "react";

import { useI18n } from "../../i18n";
import { useBackendSelectOptions } from "../../lib/ai/backendSelectOptions";
import { useAssistantScenarioModelSelectionId } from "../../lib/aiScenarioModels";
import { useAiModelsStore } from "../../stores/aiModelsStore";
import { useAiStore } from "../../stores/aiStore";
import { Select } from "../ui/Select";

export interface AiModelSelectProps {
  disabled?: boolean;
  className?: string;
}

/** AI 助手模型选择（HTTP 模型 + 外部 ACP Agent） */
export function AiModelSelect({ disabled = false, className }: AiModelSelectProps) {
  const { t } = useI18n();
  const providers = useAiModelsStore((s) => s.providers);
  const currentModelSelectionId = useAiStore((s) => s.currentModelSelectionId);
  const scenarioDefaultModelId = useAssistantScenarioModelSelectionId();
  const setCurrentModelSelectionId = useAiStore((s) => s.setCurrentModelSelectionId);

  const backendOptions = useBackendSelectOptions(providers);

  const options = useMemo(
    () =>
      backendOptions.map((opt) => ({
        value: opt.value,
        label: opt.group === "acp" ? `[Agent] ${opt.label}` : opt.label,
        subtitle: opt.subtitle,
      })),
    [backendOptions],
  );

  if (options.length === 0) {
    return (
      <span className="ai-model-select-empty">{t("ai.modelSelect.empty")}</span>
    );
  }

  const value =
    currentModelSelectionId && options.some((o) => o.value === currentModelSelectionId)
      ? currentModelSelectionId
      : scenarioDefaultModelId && options.some((o) => o.value === scenarioDefaultModelId)
        ? scenarioDefaultModelId
        : options[0]!.value;

  return (
    <Select
      value={value}
      onChange={setCurrentModelSelectionId}
      options={options}
      size="sm"
      borderless
      disabled={disabled}
      searchable={options.length > 6}
      aria-label={t("ai.modelSelect.label")}
      className={["ai-model-select", className].filter(Boolean).join(" ")}
    />
  );
}

/** 当前选中模型的显示名（用于标题等） */
export function useSelectedModelLabel(): string | null {
  const providers = useAiModelsStore((s) => s.providers);
  const currentModelSelectionId = useAiStore((s) => s.currentModelSelectionId);
  const backendOptions = useBackendSelectOptions(providers);

  return useMemo(() => {
    if (!currentModelSelectionId) return null;
    const match = backendOptions.find((o) => o.value === currentModelSelectionId);
    return match?.label ?? null;
  }, [currentModelSelectionId, backendOptions]);
}
