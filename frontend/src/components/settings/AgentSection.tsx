import { useCallback, useEffect, useMemo, useState } from "react";

import { useI18n } from "../../i18n";

import { AddAcpServiceDialog } from "./AddAcpServiceDialog";

import { Button } from "../ui/Button";

import {

  connectAcpAgent,

  connectDefaultAcpAgent,

  getAcpDefaultCommand,

  getAcpStatus,

} from "../../lib/acp/acpStream";

import { syncAcpAgentConfigFile } from "../../lib/acp/syncAgentConfig";

import {

  getActiveAcpService,

  isBuiltinAcpService,

  resolveAcpModelSelectionId,

  useAcpServicesStore,

  type AcpService,

} from "../../stores/acpServicesStore";

import {

  parseModelSelectionId,

  useAiModelsStore,

} from "../../stores/aiModelsStore";

import { isTauriRuntime } from "../../lib/isTauriRuntime";
import { useSettingsStore } from "../../stores/settingsStore";

function AgentDebugToggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <div
      className={`toggle ${value ? "on" : ""}`}
      onClick={() => onChange(!value)}
      style={{ cursor: "pointer" }}
      role="switch"
      aria-checked={value}
      aria-label={label}
    />
  );
}

function resolveModelLabel(
  modelSelectionId: string | null,

  providers: ReturnType<typeof useAiModelsStore.getState>["providers"],

): string {

  if (!modelSelectionId) return "";

  const parsed = parseModelSelectionId(modelSelectionId);

  if (!parsed) return modelSelectionId;

  const provider = providers.find((p) => p.id === parsed.providerId);

  if (!provider) return parsed.modelName;

  return `${parsed.modelName} · ${provider.providerName}`;

}



export function AgentSection() {

  const { t } = useI18n();

  const services = useAcpServicesStore((s) => s.services);

  const providers = useAiModelsStore((s) => s.providers);

  const removeService = useAcpServicesStore((s) => s.removeService);

  const setActive = useAcpServicesStore((s) => s.setActive);
  const agentDebugConsole = useSettingsStore((s) => s.agentDebugConsole);
  const setAgentDebugConsole = useSettingsStore((s) => s.setAgentDebugConsole);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editService, setEditService] = useState<AcpService | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [connected, setConnected] = useState(false);

  const [statusText, setStatusText] = useState<string>("");

  const [connecting, setConnecting] = useState(false);

  const [defaultCommand, setDefaultCommand] = useState<string | null>(null);



  const openAddDialog = useCallback(() => {

    setEditService(null);

    setDialogOpen(true);

  }, []);



  useEffect(() => {

    if (!isTauriRuntime()) return;

    void getAcpDefaultCommand().then(setDefaultCommand);

  }, []);



  const refreshStatus = useCallback(async () => {

    if (!isTauriRuntime()) {

      setConnected(false);

      setStatusText(t("settings.acpServices.connection.browserMode"));

      return;

    }

    try {

      const status = await getAcpStatus();

      setConnected(status.connected);

      if (status.connected) {

        setStatusText(

          status.agentName

            ? t("settings.acpServices.connection.connectedWithName", {

                name: status.agentName,

              })

            : t("settings.acpServices.connection.connected"),

        );

      } else {

        setStatusText(t("settings.acpServices.connection.disconnected"));

      }

    } catch {

      setConnected(false);

      setStatusText(t("settings.acpServices.connection.disconnected"));

    }

  }, [t]);



  useEffect(() => {

    void refreshStatus();

  }, [refreshStatus, services]);



  const handleConnect = useCallback(async () => {

    if (!isTauriRuntime()) return;

    setConnecting(true);

    try {

      const active = getActiveAcpService(services);

      const modelSelectionId = resolveAcpModelSelectionId(active);

      if (!modelSelectionId) {

        throw new Error(t("settings.acpServices.connection.modelRequired"));

      }

      await syncAcpAgentConfigFile(modelSelectionId);



      if (active && !isBuiltinAcpService(active) && active.executablePath.trim()) {

        await connectAcpAgent(active.executablePath.trim());

      } else {

        await connectDefaultAcpAgent();

      }

      await refreshStatus();

    } catch (error) {

      setConnected(false);

      setStatusText(error instanceof Error ? error.message : String(error));

    } finally {

      setConnecting(false);

    }

  }, [services, refreshStatus, t]);

  const handleDebugConsoleToggle = useCallback(
    async (enabled: boolean) => {
      setAgentDebugConsole(enabled);
      if (!isTauriRuntime()) return;
      setConnecting(true);
      try {
        const active = getActiveAcpService(services);
        const modelSelectionId = resolveAcpModelSelectionId(active);
        if (!modelSelectionId) return;
        await syncAcpAgentConfigFile(modelSelectionId);
        if (active && !isBuiltinAcpService(active) && active.executablePath.trim()) {
          await connectAcpAgent(active.executablePath.trim(), enabled);
        } else {
          await connectDefaultAcpAgent(enabled);
        }
        await refreshStatus();
      } catch (error) {
        setConnected(false);
        setStatusText(error instanceof Error ? error.message : String(error));
      } finally {
        setConnecting(false);
      }
    },
    [services, refreshStatus, setAgentDebugConsole, t],
  );

  const statusClassName = useMemo(() => {

    if (connected) return "opencode-detect-status opencode-detect-status--installed";

    if (statusText && !connecting) {

      return "opencode-detect-status opencode-detect-status--missing";

    }

    return "opencode-detect-status";

  }, [connected, statusText, connecting]);



  const renderServiceCard = (service: AcpService) => {

    const isConfirmingDelete = confirmDeleteId === service.id;

    const isBuiltin = isBuiltinAcpService(service);

    const modelLabel = resolveModelLabel(service.modelSelectionId, providers);

    const pathDisplay = isBuiltin

      ? defaultCommand ?? t("settings.acpServices.builtinPath")

      : service.executablePath.trim() || t("settings.acpServices.pathEmpty");

    const displayName = isBuiltin ? t("settings.acpServices.builtinName") : service.name;



    return (

      <li

        key={service.id}

        className={`ai-provider-card${service.isActive ? " ai-provider-card--active" : ""}`}

      >

        <div className="ai-provider-header">

          <div className="ai-provider-header-main">

            <span className="ai-provider-expand-placeholder" aria-hidden />

            <div className="ai-provider-summary">

              <div className="ai-provider-title-row">

                <span className="ai-provider-name">{displayName}</span>

                {isBuiltin ? (

                  <span className="ai-model-row-standard ai-model-row-standard-openai">

                    {t("settings.acpServices.builtinBadge")}

                  </span>

                ) : null}

                {service.isActive ? (

                  <span className="ai-model-row-standard ai-model-row-standard-active">

                    {t("settings.acpServices.activeBadge")}

                  </span>

                ) : null}

              </div>

              <div className="ai-model-row-meta">

                <span className="ai-model-row-baseurl" title={pathDisplay}>

                  {pathDisplay}

                </span>

                {modelLabel ? (

                  <>

                    <span className="ai-model-row-sep">·</span>

                    <span className="ai-model-row-key" title={modelLabel}>

                      {modelLabel}

                    </span>

                  </>

                ) : null}

              </div>

            </div>

          </div>



          <div className="ai-model-row-actions">

            {isConfirmingDelete ? (

              <>

                <Button

                  variant="danger"

                  size="sm"

                  onClick={() => {

                    removeService(service.id);

                    setConfirmDeleteId(null);

                  }}

                >

                  {t("settings.acpServices.confirmDelete")}

                </Button>

                <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteId(null)}>

                  {t("settings.acpServices.cancelDelete")}

                </Button>

              </>

            ) : (

              <>

                <Button

                  variant="ghost"

                  size="sm"

                  className={`ai-model-row-activate${service.isActive ? " is-active" : ""}`}

                  onClick={() => setActive(service.id)}

                  title={

                    service.isActive

                      ? t("settings.acpServices.activeTitle")

                      : t("settings.acpServices.activateTitle")

                  }

                  aria-label={

                    service.isActive

                      ? t("settings.acpServices.activeTitle")

                      : t("settings.acpServices.activateTitle")

                  }

                >

                  <svg

                    viewBox="0 0 24 24"

                    fill="none"

                    stroke="currentColor"

                    strokeWidth="2"

                    width="14"

                    height="14"

                  >

                    <path d="M12 2v10" />

                    <path d="M5.6 5.6a9 9 0 1012.8 0" />

                  </svg>

                </Button>

                <Button

                  variant="ghost"

                  size="sm"

                  className="ai-model-row-edit"

                  onClick={() => {

                    setEditService(service);

                    setDialogOpen(true);

                  }}

                  title={t("settings.acpServices.editBtn")}

                >

                  <svg

                    viewBox="0 0 24 24"

                    fill="none"

                    stroke="currentColor"

                    strokeWidth="2"

                    width="14"

                    height="14"

                  >

                    <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />

                  </svg>

                </Button>

                {!isBuiltin ? (

                  <Button

                    variant="ghost"

                    size="sm"

                    className="ai-model-row-delete"

                    onClick={() => setConfirmDeleteId(service.id)}

                    title={t("settings.acpServices.deleteBtn")}

                  >

                    <svg

                      viewBox="0 0 24 24"

                      fill="none"

                      stroke="currentColor"

                      strokeWidth="2"

                      width="14"

                      height="14"

                    >

                      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />

                    </svg>

                  </Button>

                ) : null}

              </>

            )}

          </div>

        </div>

      </li>

    );

  };



  return (

    <div className="settings-panel active">

      <div className="settings-section">

        <div className="settings-section-header">

          <div>

            <h2>{t("settings.acpServices.title")}</h2>

            <p className="section-desc">{t("settings.acpServices.description")}</p>

          </div>

          <Button

            variant="primary"

            size="sm"

            className="ai-models-add-btn"

            onClick={openAddDialog}

            title={t("settings.acpServices.add.title")}

            aria-label={t("settings.acpServices.add.title")}

          >

            <svg

              viewBox="0 0 24 24"

              fill="none"

              stroke="currentColor"

              strokeWidth="2"

              width="14"

              height="14"

            >

              <path d="M12 5v14M5 12h14" />

            </svg>

            <span>{t("settings.acpServices.empty.cta")}</span>

          </Button>

        </div>



        <div className={statusClassName}>

          <span

            className={`opencode-detect-status__text${connected ? "" : " opencode-detect-status__text--error"}`}

          >

            {statusText || t("settings.acpServices.connection.disconnected")}

          </span>

          <Button

            variant="secondary"

            size="sm"

            disabled={connecting || !isTauriRuntime()}

            onClick={() => void handleConnect()}

          >

            {connecting

              ? t("settings.acpServices.connection.connecting")

              : t("settings.acpServices.connection.connect")}

          </Button>

        </div>

        <div className="setting-row">
          <div className="setting-label">
            <h4>{t("settings.acpServices.debugConsole.label")}</h4>
            <p>{t("settings.acpServices.debugConsole.desc")}</p>
          </div>
          <AgentDebugToggle
            value={agentDebugConsole}
            onChange={(next) => void handleDebugConsoleToggle(next)}
            label={t("settings.acpServices.debugConsole.label")}
          />
        </div>

        <ul className="ai-models-list">{services.map(renderServiceCard)}</ul>



        {defaultCommand ? (

          <p className="section-desc acp-service-hint">

            {t("settings.acpServices.hintLabel")} <code>{defaultCommand}</code>

          </p>

        ) : null}

      </div>



      <AddAcpServiceDialog

        open={dialogOpen}

        onClose={() => {

          setDialogOpen(false);

          setEditService(null);

        }}

        editService={editService}

        onSaved={() => {

          void refreshStatus();

        }}

      />

    </div>

  );

}

