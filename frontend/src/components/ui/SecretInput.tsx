import { useCallback, useState } from "react";
import { Button } from "./Button";
import { useI18n } from "../../i18n";

interface SecretInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function SecretInput({
  value,
  onChange,
  placeholder,
  multiline = false,
  rows = 4,
  className = "input",
  style,
}: SecretInputProps) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }, [value]);

  const inputStyle = { width: "100%", ...style };
  const maskClass = visible ? "" : " secret-input__field--masked";

  return (
    <div className="secret-input">
      {multiline ? (
        <textarea
          className={`${className}${maskClass}`}
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace" }}
        />
      ) : (
        <input
          className={`${className}${maskClass}`}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
        />
      )}
      <div className="secret-input__actions">
        <Button
          type="button"
          variant="icon"
          title={visible ? t("common.hideSecret") : t("common.showSecret")}
          aria-label={visible ? t("common.hideSecret") : t("common.showSecret")}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
              <path d="M1 1l22 22" />
              <path d="M14.12 14.12a3 3 0 11-4.24-4.24" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </Button>
        <Button
          type="button"
          variant="icon"
          title={copied ? t("common.copied") : t("common.copy")}
          aria-label={copied ? t("common.copied") : t("common.copy")}
          disabled={!value}
          onClick={() => void handleCopy()}
        >
          {copied ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          )}
        </Button>
      </div>
    </div>
  );
}
