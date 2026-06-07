import { useEffect, useMemo, useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
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
    [models, form.name]
  );

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleStandardChange = (next: ApiStandard) => {
    setForm((prev) => ({
      ...prev,
      apiStandard: next,
      // 切换标准时如果 baseUrl 仍是当前标准的默认值或空，则自动替换
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

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <div
        className="modal-dialog add-model-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-model-title"
      >
        <div className="modal-header">
          <div>
            <h3 id="add-model-title">{t("settings.aiModels.add.title")}</h3>
            <p className="modal-subtitle">{t("settings.aiModels.add.subtitle")}</p>
          </div>
          <Button variant="icon" type="button" onClick={onClose} aria-label={t("shell.topbar.close")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </Button>
        </div>

        <div className="modal-body add-model-body">
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
            <label htmlFor="add-model-standard">{t("settings.aiModels.fields.standard")}</label>
            <select
              id="add-model-standard"
              className="input"
              value={form.apiStandard}
              onChange={(e) => handleStandardChange(e.target.value as ApiStandard)}
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
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
            <div className="form-field-hint">
              {t("settings.aiModels.fields.apiKeyHint")}
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}
        </div>

        <div className="modal-footer">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            {t("settings.aiModels.add.cancel")}
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={submit}>
            {t("settings.aiModels.add.confirm")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
