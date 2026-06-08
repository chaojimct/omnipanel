import { useEffect, useState } from "react";
import { FormDialog } from "../ui/FormDialog";
import { useI18n } from "../../i18n";
import {
  defaultBaseUrlFor,
  findModelNameConflict,
  isValidBaseUrl,
  parseModelNames,
  useAiModelsStore,
  type AiModelProvider,
  type ApiStandard,
} from "../../stores/aiModelsStore";

interface AddModelDialogProps {
  open: boolean;
  onClose: () => void;
  /** 传入时为编辑模式 */
  editProvider?: AiModelProvider | null;
}

interface FormState {
  providerName: string;
  modelNames: string;
  apiStandard: ApiStandard;
  baseUrl: string;
  apiKey: string;
  baseUrlTouched: boolean;
}

const EMPTY_FORM: FormState = {
  providerName: "",
  modelNames: "",
  apiStandard: "openai",
  baseUrl: "",
  apiKey: "",
  baseUrlTouched: false,
};

const API_STANDARD_OPTIONS: { value: ApiStandard; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
];

export function AddModelDialog({ open, onClose, editProvider }: AddModelDialogProps) {
  const { t } = useI18n();
  const providers = useAiModelsStore((s) => s.providers);
  const addProvider = useAiModelsStore((s) => s.addProvider);
  const updateProvider = useAiModelsStore((s) => s.updateProvider);

  const isEdit = Boolean(editProvider);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editProvider) {
      setForm({
        providerName: editProvider.providerName,
        modelNames: editProvider.modelNames.join(", "),
        apiStandard: editProvider.apiStandard,
        baseUrl: editProvider.baseUrl,
        apiKey: "",
        baseUrlTouched: true,
      });
    } else {
      setForm({ ...EMPTY_FORM, baseUrl: defaultBaseUrlFor(EMPTY_FORM.apiStandard) });
    }
    setError(null);
  }, [open, editProvider]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleStandardChange = (next: ApiStandard) => {
    setForm((prev) => ({
      ...prev,
      apiStandard: next,
      baseUrl:
        prev.baseUrlTouched && prev.baseUrl && prev.baseUrl !== defaultBaseUrlFor(prev.apiStandard)
          ? prev.baseUrl
          : defaultBaseUrlFor(next),
    }));
    setError(null);
  };

  const validateModelNames = (excludeProviderId?: string) => {
    const parsed = parseModelNames(form.modelNames);
    if (!parsed.ok) {
      setError(t("settings.aiModels.errors.nameDuplicateInInput", { name: parsed.duplicate }));
      return null;
    }
    if (parsed.names.length === 0) {
      setError(t("settings.aiModels.errors.modelNamesRequired"));
      return null;
    }
    for (const name of parsed.names) {
      const conflict = findModelNameConflict(providers, name, excludeProviderId);
      if (conflict) {
        setError(
          t("settings.aiModels.errors.modelNameDuplicate", {
            name: conflict.modelName,
            provider: conflict.providerName,
          })
        );
        return null;
      }
    }
    return parsed.names;
  };

  const submit = () => {
    const providerName = form.providerName.trim();
    const baseUrl = form.baseUrl.trim();
    const apiKey = form.apiKey.trim();

    if (!providerName) {
      setError(t("settings.aiModels.errors.providerNameRequired"));
      return;
    }
    if (!isValidBaseUrl(baseUrl)) {
      setError(t("settings.aiModels.errors.baseUrlInvalid"));
      return;
    }

    if (isEdit && editProvider) {
      const modelNames = validateModelNames(editProvider.id);
      if (!modelNames) return;
      if (!apiKey && !editProvider.apiKey) {
        setError(t("settings.aiModels.errors.apiKeyRequired"));
        return;
      }

      updateProvider(editProvider.id, {
        providerName,
        modelNames,
        apiStandard: form.apiStandard,
        baseUrl,
        ...(apiKey ? { apiKey } : {}),
      });
      onClose();
      return;
    }

    const modelNames = validateModelNames();
    if (!modelNames) return;
    if (!apiKey) {
      setError(t("settings.aiModels.errors.apiKeyRequired"));
      return;
    }

    addProvider({
      providerName,
      modelNames,
      apiStandard: form.apiStandard,
      baseUrl,
      apiKey,
    });
    onClose();
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={isEdit ? t("settings.aiModels.edit.title") : t("settings.aiModels.add.title")}
      subtitle={isEdit ? t("settings.aiModels.edit.subtitle") : t("settings.aiModels.add.subtitle")}
      titleId="add-model-title"
      size="sm"
      bodyClassName="add-model-body"
      cancelLabel={t("settings.aiModels.add.cancel")}
      cancelVariant="ghost"
      primaryAction={{
        label: isEdit ? t("settings.aiModels.edit.confirm") : t("settings.aiModels.add.confirm"),
        onClick: submit,
      }}
    >
      <div className="form-field">
        <label htmlFor="add-model-provider">{t("settings.aiModels.fields.providerName")}</label>
        <input
          id="add-model-provider"
          className="input"
          autoFocus
          value={form.providerName}
          onChange={(e) => updateField("providerName", e.target.value)}
          placeholder={t("settings.aiModels.fields.providerNamePlaceholder")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
      </div>

      <div className="form-field">
        <label htmlFor="add-model-names">{t("settings.aiModels.fields.modelNames")}</label>
        <input
          id="add-model-names"
          className="input"
          value={form.modelNames}
          onChange={(e) => updateField("modelNames", e.target.value)}
          placeholder={t("settings.aiModels.fields.modelNamesPlaceholder")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
        <div className="form-field-hint">{t("settings.aiModels.fields.modelNamesHint")}</div>
      </div>

      <div className="form-field">
        <span id="add-model-standard-label" className="form-label">
          {t("settings.aiModels.fields.standard")}
        </span>
        <div
          className="form-radio-group"
          role="radiogroup"
          aria-labelledby="add-model-standard-label"
        >
          {API_STANDARD_OPTIONS.map((option) => (
            <label key={option.value} className="form-radio-option">
              <input
                type="radio"
                name="add-model-api-standard"
                value={option.value}
                checked={form.apiStandard === option.value}
                onChange={() => handleStandardChange(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="add-model-baseurl">{t("settings.aiModels.fields.baseUrl")}</label>
        <input
          id="add-model-baseurl"
          className="input"
          value={form.baseUrl}
          onChange={(e) =>
            setForm((p) => ({ ...p, baseUrl: e.target.value, baseUrlTouched: true }))
          }
          placeholder={defaultBaseUrlFor(form.apiStandard)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
      </div>

      <div className="form-field">
        <label htmlFor="add-model-apikey">{t("settings.aiModels.fields.apiKey")}</label>
        <input
          id="add-model-apikey"
          className="input"
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={form.apiKey}
          onChange={(e) => updateField("apiKey", e.target.value)}
          placeholder={
            isEdit
              ? t("settings.aiModels.fields.apiKeyPlaceholderEdit")
              : t("settings.aiModels.fields.apiKeyPlaceholder")
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
        <div className="form-field-hint">
          {isEdit ? t("settings.aiModels.fields.apiKeyHintEdit") : t("settings.aiModels.fields.apiKeyHint")}
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}
    </FormDialog>
  );
}
