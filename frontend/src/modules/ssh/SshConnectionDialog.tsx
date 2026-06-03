import { useEffect, useState } from "react";
import { useI18n } from "../../i18n";
import { Modal } from "../../components/ui/Modal";
import { useConnectionStore } from "../../stores/connectionStore";
import type { Connection } from "../../ipc/bindings";

interface SshConnectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  editConnection?: Connection;
}

type AuthType = "password" | "privateKey";

interface SshFormData {
  name: string;
  host: string;
  port: string;
  user: string;
  authType: AuthType;
  password: string;
  pem: string;
  passphrase: string;
  group: string;
  envTag: string;
}

const EMPTY_FORM: SshFormData = {
  name: "",
  host: "",
  port: "22",
  user: "root",
  authType: "password",
  password: "",
  pem: "",
  passphrase: "",
  group: "默认",
  envTag: "dev",
};

function formToConnection(form: SshFormData, existingId?: string): Connection {
  const auth = form.authType === "password"
    ? { type: "password", password: form.password }
    : { type: "privateKey", pem: form.pem, passphrase: form.passphrase || null };
  const config = JSON.stringify({
    host: form.host,
    port: parseInt(form.port, 10) || 22,
    user: form.user,
    auth,
  });
  return {
    id: existingId || "",
    kind: "ssh",
    name: form.name,
    group: form.group,
    envTag: form.envTag,
    config,
  };
}

function connectionToForm(conn: Connection): SshFormData {
  const result = { ...EMPTY_FORM, name: conn.name, group: conn.group || "", envTag: conn.envTag || "dev" };
  try {
    const cfg = JSON.parse(conn.config || "{}") as Record<string, unknown>;
    if (typeof cfg.host === "string") result.host = cfg.host;
    if (typeof cfg.port === "number") result.port = String(cfg.port);
    if (typeof cfg.user === "string") result.user = cfg.user;
    const auth = cfg.auth as Record<string, unknown> | undefined;
    if (auth) {
      if (auth.type === "privateKey") {
        result.authType = "privateKey";
        if (typeof auth.pem === "string") result.pem = auth.pem;
        if (typeof auth.passphrase === "string") result.passphrase = auth.passphrase;
      } else {
        result.authType = "password";
        if (typeof auth.password === "string") result.password = auth.password;
      }
    }
  } catch { /* ignore */ }
  return result;
}

export function SshConnectionDialog({ open, onClose, onSaved, editConnection }: SshConnectionDialogProps) {
  const { t } = useI18n();
  const saveConn = useConnectionStore((s) => s.save);
  const [form, setForm] = useState<SshFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!editConnection?.id;

  useEffect(() => {
    if (!open) return;
    if (editConnection) {
      setForm(connectionToForm(editConnection));
    } else {
      setForm(EMPTY_FORM);
    }
    setError(null);
    setSaving(false);
  }, [open, editConnection]);

  if (!open) return null;

  const update = <K extends keyof SshFormData>(key: K, value: SshFormData[K]) => {
    setError(null);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = (): string | null => {
    if (!form.name.trim()) return t("ssh.dialog.nameRequired");
    if (!form.host.trim()) return t("ssh.dialog.hostRequired");
    if (!form.user.trim()) return t("ssh.dialog.userRequired");
    if (form.authType === "password" && !form.password.trim()) return t("ssh.dialog.passwordRequired");
    if (form.authType === "privateKey" && !form.pem.trim()) return t("ssh.dialog.keyRequired");
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true);
    setError(null);
    try {
      const conn = formToConnection(form, editConnection?.id);
      await saveConn(conn);
      onSaved?.();
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const title = isEdit ? t("ssh.dialog.editTitle") : t("ssh.dialog.addTitle");

  return (
    <Modal open={open} onClose={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn-icon" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="form-field">
            <label className="form-label">{t("ssh.dialog.name")}</label>
            <input className="input" placeholder={t("ssh.dialog.namePlaceholder")} value={form.name} onChange={(e) => update("name", e.target.value)} style={{ width: "100%" }} />
          </div>

          <div className="form-row">
            <div className="form-field" style={{ flex: 2 }}>
              <label className="form-label">{t("ssh.dialog.host")}</label>
              <input className="input" placeholder="example.com" value={form.host} onChange={(e) => update("host", e.target.value)} style={{ width: "100%" }} />
            </div>
            <div className="form-field" style={{ flex: 1 }}>
              <label className="form-label">{t("ssh.dialog.port")}</label>
              <input className="input" placeholder="22" value={form.port} onChange={(e) => update("port", e.target.value)} style={{ width: "100%" }} />
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">{t("ssh.dialog.user")}</label>
            <input className="input" placeholder="root" value={form.user} onChange={(e) => update("user", e.target.value)} style={{ width: "100%" }} />
          </div>

          <div className="form-field">
            <label className="form-label">{t("ssh.dialog.authType")}</label>
            <div className="engine-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <button className={`engine-chip${form.authType === "password" ? " engine-chip--active" : ""}`} onClick={() => update("authType", "password")}>
                <span>{t("ssh.dialog.passwordAuth")}</span>
              </button>
              <button className={`engine-chip${form.authType === "privateKey" ? " engine-chip--active" : ""}`} onClick={() => update("authType", "privateKey")}>
                <span>{t("ssh.dialog.keyAuth")}</span>
              </button>
            </div>
          </div>

          {form.authType === "password" ? (
            <div className="form-field">
              <label className="form-label">{t("ssh.dialog.password")}</label>
              <input className="input" type="password" placeholder="••••••" value={form.password} onChange={(e) => update("password", e.target.value)} style={{ width: "100%" }} />
            </div>
          ) : (
            <>
              <div className="form-field">
                <label className="form-label">{t("ssh.dialog.pem")}</label>
                <textarea className="input" rows={4} placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;..." value={form.pem} onChange={(e) => update("pem", e.target.value)} style={{ width: "100%", resize: "vertical", fontFamily: "monospace" }} />
              </div>
              <div className="form-field">
                <label className="form-label">{t("ssh.dialog.passphrase")}</label>
                <input className="input" type="password" placeholder={t("ssh.dialog.passphrasePlaceholder")} value={form.passphrase} onChange={(e) => update("passphrase", e.target.value)} style={{ width: "100%" }} />
              </div>
            </>
          )}

          <div className="form-row">
            <div className="form-field" style={{ flex: 1 }}>
              <label className="form-label">{t("ssh.dialog.group")}</label>
              <select className="input" value={form.group} onChange={(e) => update("group", e.target.value)} style={{ width: "100%" }}>
                <option value="默认">{t("ssh.dialog.defaultGroup")}</option>
                <option value="生产">生产</option>
                <option value="预发">预发</option>
                <option value="开发">开发</option>
              </select>
            </div>
            <div className="form-field" style={{ flex: 1 }}>
              <label className="form-label">{t("ssh.dialog.envTag")}</label>
              <select className="input" value={form.envTag} onChange={(e) => update("envTag", e.target.value)} style={{ width: "100%" }}>
                <option value="dev">{t("env.dev")}</option>
                <option value="staging">{t("env.staging")}</option>
                <option value="prod">{t("env.prod")}</option>
                <option value="local">{t("env.local")}</option>
                <option value="unknown">{t("env.unknown")}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>{t("ssh.dialog.cancel")}</button>
          {error ? <span className="modal-footer-status modal-footer-status--error">{error}</span> : <div className="modal-footer-spacer" />}
          <button className="btn btn-primary" onClick={() => void handleSave()} disabled={saving}>{saving ? t("ssh.dialog.saving") : t("ssh.dialog.save")}</button>
        </div>
      </div>
    </Modal>
  );
}
