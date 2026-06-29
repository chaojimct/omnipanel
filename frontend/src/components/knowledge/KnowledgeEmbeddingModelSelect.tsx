import { useMemo } from "react";

import { useI18n } from "../../i18n";
import {
  defaultBaseUrlFor,
  listModelSelections,
  parseModelSelectionId,
  useAiModelsStore,
} from "../../stores/aiModelsStore";
import { useSettingsStore } from "../../stores/settingsStore";
import {
  isKnowledgeEmbeddingCustomModelReady,
  resolveConfiguredEmbeddingSelectionId,
  resolveKnowledgeEmbeddingProvider,
  type KnowledgeEmbeddingModelMode,
} from "../../lib/knowledgeEmbeddingModel";
import { Select } from "../ui/Select";

export interface KnowledgeEmbeddingModelSelectProps {
  disabled?: boolean;
  className?: string;
}

const MODE_OPTIONS: KnowledgeEmbeddingModelMode[] = ["configured", "custom"];

/** 知识库默认 Embedding 模型配置（已配置列表 / 自定义） */
export function KnowledgeEmbeddingModelSelect({
  disabled = false,
  className,
}: KnowledgeEmbeddingModelSelectProps) {
  const { t } = useI18n();
  const providers = useAiModelsStore((s) => s.providers);
  const mode = useSettingsStore((s) => s.knowledgeEmbeddingModelMode);
  const selectionId = useSettingsStore((s) => s.knowledgeEmbeddingModelSelectionId);
  const customModel = useSettingsStore((s) => s.knowledgeEmbeddingCustomModel);
  const setKnowledgeSettings = useSettingsStore((s) => s.setKnowledgeSettings);

  const configuredOptions = useMemo(() => {
    return listModelSelections(providers).map(({ id }) => {
      const parsed = parseModelSelectionId(id);
      const provider = providers.find((p) => p.id === parsed?.providerId);
      const modelName = parsed?.modelName ?? id;
      const standard =
        provider?.apiStandard === "anthropic" ? "Anthropic" : "OpenAI";
      return {
        value: id,
        label: modelName,
        subtitle: provider ? `${provider.providerName} · ${standard}` : undefined,
      };
    });
  }, [providers]);

  const configuredValue = resolveConfiguredEmbeddingSelectionId(providers, selectionId) ?? "";

  const updateCustomModel = (patch: Partial<typeof customModel>) => {
    setKnowledgeSettings({
      knowledgeEmbeddingCustomModel: { ...customModel, ...patch },
    });
  };

  return (
    <div
      className={["knowledge-embedding-settings", className].filter(Boolean).join(" ")}
    >
      <div
        className="form-radio-group knowledge-embedding-mode-group"
        role="radiogroup"
        aria-label={t("settings.knowledge.embeddingModel")}
      >
        {MODE_OPTIONS.map((option) => (
          <label key={option} className="form-radio-option">
            <input
              type="radio"
              name="knowledge-embedding-mode"
              value={option}
              checked={mode === option}
              disabled={disabled}
              onChange={() => setKnowledgeSettings({ knowledgeEmbeddingModelMode: option })}
            />
            <span>{t(`settings.knowledge.embeddingModelMode.${option}`)}</span>
          </label>
        ))}
      </div>

      {mode === "configured" ? (
        configuredOptions.length === 0 ? (
          <p className="knowledge-embedding-model-empty">
            {t("settings.knowledge.embeddingConfiguredEmpty")}
          </p>
        ) : (
          <Select
            value={configuredValue}
            onChange={(next) =>
              setKnowledgeSettings({ knowledgeEmbeddingModelSelectionId: next })
            }
            options={configuredOptions}
            size="sm"
            disabled={disabled}
            searchable={configuredOptions.length > 6}
            aria-label={t("knowledge.vectorize.modelLabel")}
            className="knowledge-embedding-model-select"
          />
        )
      ) : (
        <div className="knowledge-embedding-custom-form">
          <div className="form-field">
            <label htmlFor="knowledge-embedding-model-name">
              {t("settings.knowledge.embeddingCustomModelName")}
            </label>
            <input
              id="knowledge-embedding-model-name"
              className="input"
              value={customModel.modelName}
              disabled={disabled}
              placeholder={t("settings.knowledge.embeddingCustomModelNamePlaceholder")}
              onChange={(e) => updateCustomModel({ modelName: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label htmlFor="knowledge-embedding-base-url">
              {t("settings.knowledge.embeddingCustomBaseUrl")}
            </label>
            <input
              id="knowledge-embedding-base-url"
              className="input"
              value={customModel.baseUrl}
              disabled={disabled}
              placeholder={defaultBaseUrlFor("openai")}
              onChange={(e) => updateCustomModel({ baseUrl: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label htmlFor="knowledge-embedding-api-key">
              {t("settings.knowledge.embeddingCustomApiKey")}
            </label>
            <input
              id="knowledge-embedding-api-key"
              className="input"
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={customModel.apiKey}
              disabled={disabled}
              placeholder={t("settings.knowledge.embeddingCustomApiKeyPlaceholder")}
              onChange={(e) => updateCustomModel({ apiKey: e.target.value })}
            />
          </div>
          <p className="form-field-hint">{t("settings.knowledge.embeddingCustomHint")}</p>
          {!isKnowledgeEmbeddingCustomModelReady(customModel) ? (
            <p className="form-field-hint form-field-hint-warn">
              {t("settings.knowledge.embeddingCustomIncomplete")}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

/** @deprecated 请使用 useKnowledgeEmbeddingProviderConfig */
export function useKnowledgeEmbeddingModelSelectionId(): string | null {
  const provider = useKnowledgeEmbeddingProviderConfig();
  if (!provider) {
    return null;
  }
  if (provider.providerId === "embedding-custom") {
    return null;
  }
  return `${provider.providerId}::${provider.modelName}`;
}

export function useKnowledgeEmbeddingProviderConfig() {
  const providers = useAiModelsStore((s) => s.providers);
  const mode = useSettingsStore((s) => s.knowledgeEmbeddingModelMode);
  const selectionId = useSettingsStore((s) => s.knowledgeEmbeddingModelSelectionId);
  const customModel = useSettingsStore((s) => s.knowledgeEmbeddingCustomModel);

  return useMemo(
    () =>
      resolveKnowledgeEmbeddingProvider(providers, {
        knowledgeEmbeddingModelMode: mode,
        knowledgeEmbeddingModelSelectionId: selectionId,
        knowledgeEmbeddingCustomModel: customModel,
      }),
    [providers, mode, selectionId, customModel],
  );
}
