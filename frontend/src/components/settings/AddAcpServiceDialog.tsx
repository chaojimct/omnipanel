import { useEffect, useMemo, useState } from "react";
import { open as openFileDialog } from "@tauri-apps/plugin-dialog";
import { FormDialog } from "../ui/FormDialog";
import { Select } from "../ui/Select";
import { useI18n } from "../../i18n";
import { syncAcpAgentConfigFile } from "../../lib/acp/syncAgentConfig";
import { isTauriRuntime } from "../../lib/isTauriRuntime";
import {
  firstModelSelectionId,
  listModelSelections,
  parseModelSelectionId,
  useAiModelsStore,
} from "../../stores/aiModelsStore";
import { useAcpServicesStore, isBuiltinAcpService, type AcpService } from "../../stores/acpServicesStore";

interface AddAcpServiceDialogProps {
  open: boolean;
  onClose: () => void;
  /** 传入时为编辑模式 */
  editService?: AcpService | null;
  onSaved?: (serviceId: string) => void;
}

interface FormState {
  name: string;
  executablePath: string;
  modelSelectionId: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  executablePath: "",
  modelSelectionId: "",
  isActive: false,
};

function useModelSelectOptions() {
  const providers = useAiModelsStore((s) => s.providers);
  return useMemo(() => {
    return listModelSelections(providers).map(({ id }) => {
      const parsed = parseModelSelectionId(id);
      const provider = providers.find((p) => p.id === parsed?.providerId);
      const modelName = parsed?.modelName ?? id;
      const standard = provider?.apiStandard === "anthropic" ? "Anthropic" : "OpenAI";
      return {
        value: id,
        label: modelName,
        subtitle: provider ? `${provider.providerName} · ${standard}` : undefined,
      };
    });
  }, [providers]);
}

export function AddAcpServiceDialog({
  open,
  onClose,
  editService,
  onSaved,
}: AddAcpServiceDialogProps) {
  const { t } = useI18n();
  const addService = useAcpServicesStore((s) => s.addService);
  const updateService = useAcpServicesStore((s) => s.updateService);
  const modelOptions = useModelSelectOptions();
  const defaultModelId = useMemo(
    () => firstModelSelectionId(useAiModelsStore.getState().providers) ?? "",
    [open],
  );

  const isEdit = Boolean(editService);
  const isBuiltinEdit = Boolean(editService && isBuiltinAcpService(editService));
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editService) {
      setForm({
        name: editService.name,
        executablePath: editService.executablePath,
        modelSelectionId: editService.modelSelectionId ?? defaultModelId,
        isActive: editService.isActive,
      });
    } else {
      setForm({ ...EMPTY_FORM, modelSelectionId: defaultModelId });
    }
    setError(null);
    setPicking(false);
  }, [open, editService, defaultModelId]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handlePickExecutable = async () => {
    setPicking(true);
    setError(null);
    try {
      const selected = await openFileDialog({
        title: t("settings.acpServices.pickExecutable"),
        multiple: false,
        directory: false,
      });
      if (typeof selected === "string" && selected.length > 0) {
        setForm((prev) => ({ ...prev, executablePath: selected }));
      }
    } catch (e) {
      console.warn("[AddAcpServiceDialog] 文件选择失败:", e);
      setError(
        e instanceof Error ? e.message : t("settings.acpServices.errors.pickFailed"),
      );
    } finally {
      setPicking(false);
    }
  };

  const submit = async () => {
    const name = form.name.trim();
    const executablePath = form.executablePath.trim();
    const modelSelectionId = form.modelSelectionId.trim();

    if (!name && !isBuiltinEdit) {
      setError(t("settings.acpServices.errors.nameRequired"));
      return;
    }
    if (!executablePath && !isBuiltinEdit) {
      setError(t("settings.acpServices.errors.pathRequired"));
      return;
    }
    if (!modelSelectionId) {
      setError(t("settings.acpServices.errors.modelRequired"));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (isTauriRuntime()) {
        await syncAcpAgentConfigFile(modelSelectionId);
      }

      if (isEdit && editService) {
        updateService(editService.id, {
          ...(isBuiltinEdit ? {} : { name, executablePath }),
          modelSelectionId,
          isActive: form.isActive,
        });
        onSaved?.(editService.id);
        onClose();
        return;
      }

      const created = addService({
        name,
        executablePath,
        modelSelectionId,
        isActive: form.isActive,
      });
      onSaved?.(created.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={
        isBuiltinEdit
          ? t("settings.acpServices.editBuiltin.title")
          : isEdit
            ? t("settings.acpServices.edit.title")
            : t("settings.acpServices.add.title")
      }
      subtitle={
        isBuiltinEdit
          ? t("settings.acpServices.editBuiltin.subtitle")
          : isEdit
            ? t("settings.acpServices.edit.subtitle")
            : t("settings.acpServices.add.subtitle")
      }
      titleId="add-acp-service-title"
      size="sm"
      bodyClassName="add-acp-service-body"
      cancelLabel={t("settings.acpServices.add.cancel")}
      cancelVariant="ghost"
      primaryAction={{
        label: isEdit
          ? t("settings.acpServices.edit.confirm")
          : t("settings.acpServices.add.confirm"),
        onClick: () => void submit(),
        disabled: saving,
      }}
    >
      {!isBuiltinEdit ? (
        <div className="form-field">
          <label htmlFor="add-acp-name">{t("settings.acpServices.fields.name")}</label>
          <input
            id="add-acp-name"
            className="input"
            autoFocus
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder={t("settings.acpServices.fields.namePlaceholder")}
          />
        </div>
      ) : null}

      <div className="form-field">
        <label htmlFor="add-acp-model">{t("settings.acpServices.fields.model")}</label>
        {modelOptions.length === 0 ? (
          <p className="form-field-hint">{t("settings.acpServices.fields.modelEmpty")}</p>
        ) : (
          <Select
            value={form.modelSelectionId || modelOptions[0]?.value || ""}
            onChange={(value) => updateField("modelSelectionId", value)}
            options={modelOptions}
            placeholder={t("settings.acpServices.fields.modelPlaceholder")}
            aria-label={t("settings.acpServices.fields.model")}
          />
        )}
        <div className="form-field-hint">{t("settings.acpServices.fields.modelHint")}</div>
      </div>

      {!isBuiltinEdit ? (
        <div className="form-field">
          <label htmlFor="add-acp-path">{t("settings.acpServices.fields.executablePath")}</label>
          <div style={{ display: "flex", gap: "var(--sp-2)" }}>
            <input
              id="add-acp-path"
              className="input"
              value={form.executablePath}
              onChange={(e) => updateField("executablePath", e.target.value)}
              placeholder={t("settings.acpServices.fields.executablePathPlaceholder")}
              style={{ flex: 1, fontFamily: "var(--font-mono, monospace)", fontSize: 12 }}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => void handlePickExecutable()}
              disabled={picking}
            >
              {t("settings.acpServices.browse")}
            </button>
          </div>
          <div className="form-field-hint">
            {t("settings.acpServices.fields.executablePathHint")}
          </div>
        </div>
      ) : (
        <p className="form-field-hint">{t("settings.acpServices.builtinPath")}</p>
      )}

      <div className="form-field">
        <label
          className="form-radio-option"
          style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", cursor: "pointer" }}
        >
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => updateField("isActive", e.target.checked)}
          />
          <span>{t("settings.acpServices.fields.isActive")}</span>
        </label>
        <div className="form-field-hint">{t("settings.acpServices.fields.isActiveHint")}</div>
      </div>

      {error && <div className="form-error">{error}</div>}
    </FormDialog>
  );
}
