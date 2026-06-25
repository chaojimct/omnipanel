import { SubWindow } from "../../components/ui/SubWindow";
import { useI18n } from "../../i18n";
import type { FileEntry } from "../../ipc/bindings";
import { FilePreviewContent } from "./FilePreviewContent";
import { formatFileSize } from "./utils";

export interface FilePreviewSubWindowProps {
  open: boolean;
  entry: FileEntry | null;
  connectionId: string;
  onClose: () => void;
  onDownload?: (entry: FileEntry) => void;
}

export function FilePreviewSubWindow({
  open,
  entry,
  connectionId,
  onClose,
  onDownload,
}: FilePreviewSubWindowProps) {
  const { t } = useI18n();

  const title = entry ? (
    <h2 id="subwindow-title" className="subwindow-title file-preview-subwindow-title">
      <span className="file-preview-subwindow-name">{entry.name}</span>
      {entry.size != null ? (
        <span className="file-preview-subwindow-meta">{formatFileSize(entry.size)}</span>
      ) : null}
    </h2>
  ) : (
    t("files.preview.title")
  );

  return (
    <SubWindow
      open={open}
      title={title}
      onClose={onClose}
      className="file-preview-subwindow"
      widthRatio={0.82}
      heightRatio={0.78}
      headerExtra={
        entry && onDownload ? (
          <button
            type="button"
            className="file-preview-subwindow-download"
            onClick={() => onDownload(entry)}
          >
            {t("files.actions.download")}
          </button>
        ) : null
      }
    >
      {entry ? <FilePreviewContent connectionId={connectionId} entry={entry} /> : null}
    </SubWindow>
  );
}
