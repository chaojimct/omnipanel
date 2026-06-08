import { useState, useCallback, useMemo, useEffect } from "react";
import { FormDialog } from "../../../components/ui/FormDialog";
import {
  detectCellEditorKind,
  formatCellValue,
  parseCellValue,
  normalizeDate,
  normalizeDatetime,
  normalizeTime,
  type CellEditorKind,
} from "./types";
import { TextEditor } from "./TextEditor";
import { NumberEditor } from "./NumberEditor";
import { BooleanEditor } from "./BooleanEditor";
import { DateEditor } from "./DateEditor";
import { DateTimeEditor } from "./DateTimeEditor";
import { TimeEditor } from "./TimeEditor";
import { JsonEditor } from "./JsonEditor";
import { NullEditor } from "./NullEditor";
import { useI18n } from "../../../i18n";

export interface CellEditorDialogProps {
  open: boolean;
  columnName: string;
  columnType: string;
  currentValue: unknown;
  onSave: (value: unknown) => void;
  onCancel: () => void;
}

const LABEL_MAP: Record<CellEditorKind, string> = {
  text: "Text",
  number: "Number",
  boolean: "Boolean",
  date: "Date",
  datetime: "Datetime",
  time: "Time",
  json: "JSON",
  binary: "Binary",
};

export function CellEditorDialog({
  open,
  columnName,
  columnType,
  currentValue,
  onSave,
  onCancel,
}: CellEditorDialogProps) {
  const { t } = useI18n();
  const editorKind = useMemo(() => detectCellEditorKind(columnType), [columnType]);
  const rawText = useMemo(() => formatCellValue(currentValue), [currentValue]);
  // Normalize date/time values to the format expected by native <input> controls
  const normalized = useMemo(() => {
    switch (editorKind) {
      case "date": return normalizeDate(rawText);
      case "datetime": return normalizeDatetime(rawText);
      case "time": return normalizeTime(rawText);
      default: return rawText;
    }
  }, [editorKind, rawText]);
  const [editText, setEditText] = useState(normalized);
  const isNull = currentValue === null || currentValue === undefined;

  useEffect(() => {
    if (open) {
      setEditText(normalized);
    }
  }, [open, normalized]);

  const handleSave = useCallback(() => {
    const parsed = parseCellValue(editorKind, editText);
    onSave(parsed);
  }, [editorKind, editText, onSave]);

  const renderEditor = () => {
    const props = { value: editText, onChange: setEditText };
    switch (editorKind) {
      case "number":
        return <NumberEditor {...props} />;
      case "boolean":
        return <BooleanEditor {...props} />;
      case "date":
        return <DateEditor {...props} />;
      case "datetime":
        return <DateTimeEditor {...props} />;
      case "time":
        return <TimeEditor {...props} />;
      case "json":
        return <JsonEditor {...props} />;
      case "binary":
        return <TextEditor {...props} />;
      default:
        return isNull ? <NullEditor {...props} /> : <TextEditor {...props} />;
    }
  };

  return (
    <FormDialog
      open={open}
      onClose={onCancel}
      title={t("database.cellEditor.title")}
      className="cell-editor-dialog"
      showCloseButton={false}
      beforeBody={
        <div className="cell-editor-meta">
          <span className="cell-editor-col-name">{columnName}</span>
          <span className="cell-editor-col-type">{columnType}</span>
          <span className="cell-editor-kind-badge">{LABEL_MAP[editorKind]}</span>
          {isNull && <span className="cell-editor-kind-badge cell-editor-kind-badge--null">NULL</span>}
        </div>
      }
      onCancel={onCancel}
      primaryAction={{
        label: t("common.confirm"),
        onClick: handleSave,
      }}
    >
      {renderEditor()}
    </FormDialog>
  );
}
