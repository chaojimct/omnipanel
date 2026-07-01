import { useEffect, useState } from "react";

import { createPortal } from "react-dom";

import { FormDialog, FormField } from "../../../components/ui/FormDialog";

import { TextInput } from "../../../components/ui/TextInput";

import { useI18n } from "../../../i18n";

import type { ToolboxTabId } from "./types";



export interface SyncTaskSettings {

  taskName: string;

  schemaCaseSensitive: boolean;

}



interface SyncTaskSettingsDialogProps {

  open: boolean;

  onClose: () => void;

  tab: ToolboxTabId;

  taskName: string;

  schemaCaseSensitive: boolean;

  onApply: (settings: SyncTaskSettings) => void;

}



export function SyncTaskSettingsDialog({

  open,

  onClose,

  tab,

  taskName,

  schemaCaseSensitive,

  onApply,

}: SyncTaskSettingsDialogProps) {

  const { t } = useI18n();

  const [draftName, setDraftName] = useState(taskName);

  const [draftCaseSensitive, setDraftCaseSensitive] = useState(schemaCaseSensitive);

  const [error, setError] = useState<string | null>(null);



  useEffect(() => {

    if (!open) return;

    setDraftName(taskName);

    setDraftCaseSensitive(schemaCaseSensitive);

    setError(null);

  }, [open, taskName, schemaCaseSensitive]);



  const handleApply = () => {

    const name = draftName.trim();

    if (!name) {

      setError(t("database.syncTasks.nameRequired"));

      return;

    }

    onApply({

      taskName: name,

      schemaCaseSensitive: draftCaseSensitive,

    });

    onClose();

  };



  if (!open) {

    return null;

  }



  return createPortal(

    <FormDialog

      open={open}

      onClose={onClose}

      title={t("database.toolbox.settingsTitle")}

      size="sm"

      onCancel={onClose}

      clipboardAssist={false}

      status={error ? { kind: "error", message: error } : null}

      primaryAction={{

        label: t("common.save"),

        onClick: handleApply,

      }}

    >

      <FormField label={t("database.syncTasks.namePlaceholder")} htmlFor="sync-settings-name">

        <TextInput

          id="sync-settings-name"

          className="input"

          autoFocus

          value={draftName}

          placeholder={t("database.syncTasks.namePlaceholder")}

          onChange={(value) => {

            setDraftName(value);

            if (error) setError(null);

          }}

        />

      </FormField>

      {tab === "schemaSync" ? (

        <FormField label={t("database.toolbox.settingsSchemaCaseSensitive")}>

          <label

            className="db-toolbox-show-matching db-toolbox-settings-toggle"

            onClick={(event) => {

              event.preventDefault();

              setDraftCaseSensitive((prev) => !prev);

            }}

          >

            <span>{t("database.toolbox.settingsSchemaCaseSensitiveHint")}</span>

            <div

              className={`toggle${draftCaseSensitive ? " on" : ""}`}

              role="switch"

              aria-checked={draftCaseSensitive}

              aria-label={t("database.toolbox.settingsSchemaCaseSensitive")}

            />

          </label>

        </FormField>

      ) : null}

    </FormDialog>,

    document.body,

  );

}


