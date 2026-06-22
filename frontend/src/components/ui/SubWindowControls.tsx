import { useI18n } from "../../i18n";

interface SubWindowControlsProps {
  isMaximized: boolean;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onClose: () => void;
}

/** SubWindow 内嵌窗口控制（最小化 / 最大化 / 关闭） */
export function SubWindowControls({
  isMaximized,
  onMinimize,
  onToggleMaximize,
  onClose,
}: SubWindowControlsProps) {
  const { t } = useI18n();

  return (
    <div className="win-controls subwindow-win-controls">
      <button
        type="button"
        className="win-btn minimize"
        title={t("shell.topbar.minimize")}
        aria-label={t("shell.topbar.minimize")}
        onClick={onMinimize}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
          <path d="M0 5h10" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </button>
      <button
        type="button"
        className="win-btn maximize"
        title={isMaximized ? t("shell.topbar.restore") : t("shell.topbar.maximize")}
        aria-label={isMaximized ? t("shell.topbar.restore") : t("shell.topbar.maximize")}
        onClick={onToggleMaximize}
      >
        {isMaximized ? (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
            <rect x="0.5" y="0.5" width="5.5" height="5.5" stroke="currentColor" strokeWidth="1.2" />
            <rect x="4" y="4" width="5.5" height="5.5" fill="var(--bg)" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
            <rect x="0.5" y="0.5" width="9" height="9" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        )}
      </button>
      <button
        type="button"
        className="win-btn close"
        title={t("shell.topbar.close")}
        aria-label={t("shell.topbar.close")}
        onClick={onClose}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
          <path d="M0 0l10 10M10 0L0 10" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </button>
    </div>
  );
}
