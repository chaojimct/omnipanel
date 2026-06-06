import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { useKnowledgeStore } from "../../stores/knowledgeStore";
import { useI18n } from "../../i18n";
import type { KnowledgeEntry } from "../../ipc/bindings";

interface CreateEntryDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateEntryDialog({ open, onClose }: CreateEntryDialogProps) {
  const { t } = useI18n();
  const saveEntry = useKnowledgeStore((s) => s.saveEntry);

  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("snippet");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [riskLevel, setRiskLevel] = useState("safe");
  const [source, setSource] = useState("");
  const [language, setLanguage] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setTitle("");
      setKind("snippet");
      setContent("");
      setTags("");
      setRiskLevel("safe");
      setSource("");
      setLanguage("");
      setSaving(false);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const now = new Date().toISOString();
    const entry: KnowledgeEntry = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2),
      kind,
      title: title.trim(),
      content,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      riskLevel,
      source: source || null,
      envTag: null,
      language: language || null,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    const ok = await saveEntry(entry);
    setSaving(false);
    if (ok) {
      onClose();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="knowledge-dialog" onClick={handleOverlayClick}>
      <div className="knowledge-dialog-panel">
        <div className="knowledge-dialog-header">
          <h3>{t("knowledge.create")}</h3>
          <button className="knowledge-dialog-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="knowledge-dialog-body">
          <div className="knowledge-field">
            <label>{t("knowledge.title")} *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("knowledge.title")}
              autoFocus
            />
          </div>
          <div className="knowledge-field-row">
            <div className="knowledge-field">
              <label>{t("knowledge.type")}</label>
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="snippet">{t("knowledge.types.snippet")}</option>
                <option value="case">{t("knowledge.types.case")}</option>
                <option value="ai">{t("knowledge.types.ai")}</option>
              </select>
            </div>
            <div className="knowledge-field">
              <label>{t("knowledge.riskLevel")}</label>
              <select
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value)}
              >
                <option value="safe">{t("knowledge.risks.safe")}</option>
                <option value="readonly">{t("knowledge.risks.readonly")}</option>
                <option value="medium">{t("knowledge.risks.medium")}</option>
                <option value="dangerous">{t("knowledge.risks.dangerous")}</option>
              </select>
            </div>
          </div>
          <div className="knowledge-field">
            <label>{t("knowledge.content")}</label>
            <div className="knowledge-editor-shell">
              <Editor
                height="240px"
                language="markdown"
                theme="vs-dark"
                value={content}
                onChange={(v) => setContent(v ?? "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: "on",
                  wordWrap: "on",
                  scrollBeyondLastLine: false,
                  padding: { top: 8, bottom: 8 },
                }}
              />
            </div>
          </div>
          <div className="knowledge-field-row">
            <div className="knowledge-field">
              <label>{t("knowledge.source")}</label>
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder={t("knowledge.source")}
              />
            </div>
            <div className="knowledge-field">
              <label>{t("knowledge.language")}</label>
              <input
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder={t("knowledge.language")}
              />
            </div>
          </div>
          <div className="knowledge-field">
            <label>{t("knowledge.tags")} (逗号分隔)</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3"
            />
          </div>
        </div>
        <div className="knowledge-dialog-footer">
          <button className="knowledge-btn" onClick={onClose}>
            {t("knowledge.cancel")}
          </button>
          <button
            className="knowledge-btn knowledge-btn-primary"
            onClick={handleSubmit}
            disabled={saving || !title.trim()}
          >
            {saving ? "…" : t("knowledge.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
