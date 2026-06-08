import { useEffect, useMemo, useState } from "react";
import { FormDialog } from "../ui/FormDialog";
import { useI18n } from "../../i18n";
import {
  defaultBaseUrlFor,
  findNameConflict,
  isValidBaseUrl,
  useAiModelsStore,
  type ApiStandard,
} from "../../stores/aiModelsStore";

interface AddModelDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
}

interface FormState {
  name: string;
  apiStandard: ApiStandard;
  baseUrl: string;
  apiKey: string;
  baseUrlTouched: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  apiStandard: "openai",
  baseUrl: "",
  apiKey: "",
  baseUrlTouched: false,
};

const API_STANDARD_OPTIONS: { value: ApiStandard; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
];

export function AddModelDialog({ open, onClose, onCreated }: AddModelDialogProps) {
  const { t } = useI18n();
  const models = useAiModelsStore((s) => s.models);
  const addModel = useAiModelsStore((s) => s.addModel);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm({ ...EMPTY_FORM, baseUrl: defaultBaseUrlFor(EMPTY_FORM.apiStandard) });
    setError(null);
  }, [open]);

  const conflict = useMemo(
    () => (form.name.trim() ? findNameConflict(models, form.name) : null),
    [models, form.name],
  );

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

  const submit = () => {
    const name = form.name.trim();
    const baseUrl = form.baseUrl.trim();
    const apiKey = form.apiKey.trim();

    if (!name) {
      setError(t("settings.aiModels.errors.nameRequired"));
      return;
    }
    if (conflict) {
      setError(t("settings.aiModels.errors.nameDuplicate", { name: conflict.name }));
      return;
    }
    if (!isValidBaseUrl(baseUrl)) {
      setError(t("settings.aiModels.errors.baseUrlInvalid"));
      return;
    }
    if (!apiKey) {
      setError(t("settings.aiModels.errors.apiKeyRequired"));
      return;
    }

    const created = addModel({ name, apiStandard: form.apiStandard, baseUrl, apiKey });
    onCreated?.(created.id);
    onClose();
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={t("settings.aiModels.add.title")}
      subtitle={t("settings.aiModels.add.subtitle")}
      titleId="add-model-title"
      size="sm"
      bodyClassName="add-model-body"
      cancelLabel={t("settings.aiModels.add.cancel")}
      cancelVariant="ghost"
      primaryAction={{ label: t("settings.aiModels.add.confirm"), onClick: submit }}
    >
      <div className="form-field">
        <label htmlFor="add-model-name">{t("settings.aiModels.fields.name")}</label>
        <input
          id="add-model-name"
          className="input"
          autoFocus
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder={t("settings.aiModels.fields.namePlaceholder")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
        {conflict && (
          <div className="form-field-hint form-field-hint-warn">
            {t("settings.aiModels.errors.nameDuplicate", { name: conflict.name })}
          </div>
        )}
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
          placeholder={t("settings.aiModels.fields.apiKeyPlaceholder")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
        <div className="form-field-hint">{t("settings.aiModels.fields.apiKeyHint")}</div>
      </div>

      {error && <div className="form-error">{error}</div>}
    </FormDialog>
  );
}
