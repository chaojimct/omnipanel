import { useEffect, useState } from "react";
import { Modal } from "../../components/ui/Modal";
import { useI18n } from "../../i18n";

export interface ServerEntry {
  id: string;
  name: string;
  address: string;
  key: string;
  serviceType: "bt" | "1panel";
  createdAt: number;
}

interface CreateServerDialogProps {
  open: boolean;
  editServer?: ServerEntry | null;
  onClose: () => void;
  onCreate: (server: ServerEntry) => void;
  onUpdate: (server: ServerEntry) => void;
}

export function CreateServerDialog({ open, editServer, onClose, onCreate, onUpdate }: CreateServerDialogProps) {
  const { t } = useI18n();
  const isEdit = !!editServer;
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [key, setKey] = useState("");
  const [serviceType, setServiceType] = useState<"bt" | "1panel">("bt");

  useEffect(() => {
    if (open && editServer) {
      setName(editServer.name);
      setAddress(editServer.address);
      setKey(editServer.key);
      setServiceType(editServer.serviceType);
    } else if (open && !editServer) {
      setName("");
      setAddress("");
      setKey("");
      setServiceType("bt");
    }
  }, [open, editServer]);

  const handleSubmit = () => {
    if (!name.trim() || !address.trim() || !key.trim()) return;
    if (isEdit && editServer) {
      onUpdate({
        ...editServer,
        name: name.trim(),
        address: address.trim(),
        key: key.trim(),
        serviceType,
      });
    } else {
      onCreate({
        id: `server-${Date.now()}`,
        name: name.trim(),
        address: address.trim(),
        key: key.trim(),
        serviceType,
        createdAt: Date.now(),
      });
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="modal-dialog">
        <div className="modal-header">
          <h3>{isEdit ? t("server.edit.title") : t("server.create.title")}</h3>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">{t("server.create.name")}</label>
            <input
              className="form-input"
              type="text"
              placeholder="my-server"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t("server.create.address")}</label>
            <input
              className="form-input"
              type="text"
              placeholder="192.168.1.100:8888"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t("server.create.key")}</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t("server.create.serviceType")}</label>
            <div className="form-select-group">
              <button
                type="button"
                className={`form-select-btn${serviceType === "bt" ? " active" : ""}`}
                onClick={() => setServiceType("bt")}
              >
                宝塔
              </button>
              <button
                type="button"
                className={`form-select-btn${serviceType === "1panel" ? " active" : ""}`}
                onClick={() => setServiceType("1panel")}
              >
                1Panel
              </button>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <div className="modal-footer-spacer" />
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!name.trim() || !address.trim() || !key.trim()}
            onClick={handleSubmit}
          >
            {isEdit ? t("common.save") : t("server.create.confirm")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
