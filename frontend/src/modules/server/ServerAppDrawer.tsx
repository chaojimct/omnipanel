import { useEffect, useState } from "react";
import { LogViewer } from "../../components/ui/LogViewer";
import { SubWindow } from "../../components/ui/SubWindow";
import { useI18n } from "../../i18n";
import type { OnePanelInstalledApp } from "../../lib/onepanel";
import type { ServerEntry } from "./CreateServerDialog";
import { useAppComposeLogs } from "./useAppComposeLogs";

type AppTab = "detail" | "logs";

interface ServerAppDrawerProps {
  server: ServerEntry;
  app: OnePanelInstalledApp | null;
  onClose: () => void;
}

function formatAppPort(app: OnePanelInstalledApp): string {
  const parts: string[] = [];
  if (app.httpPort) parts.push(`HTTP ${app.httpPort}`);
  if (app.httpsPort) parts.push(`HTTPS ${app.httpsPort}`);
  return parts.length > 0 ? parts.join(" / ") : "-";
}

function DetailTab({ app, t }: { app: OnePanelInstalledApp; t: ReturnType<typeof useI18n>["t"] }) {
  const displayName = app.appName || app.name || app.appKey || "-";
  const status = app.status || app.appStatus || "-";

  const rows: Array<{ label: string; value: string }> = [
    { label: t("server.apps.drawer.appName"), value: displayName },
    { label: t("server.apps.drawer.instance"), value: app.name || "-" },
    { label: t("server.apps.drawer.appKey"), value: app.appKey || "-" },
    { label: t("server.apps.version"), value: app.version || "-" },
    { label: t("server.apps.status"), value: status },
    { label: t("server.apps.type"), value: app.appType || "-" },
    { label: t("server.apps.port"), value: formatAppPort(app) },
    { label: t("server.apps.drawer.container"), value: app.container || "-" },
    { label: t("server.apps.drawer.service"), value: app.serviceName || "-" },
    { label: t("server.apps.drawer.path"), value: app.path || "-" },
    { label: t("server.apps.drawer.createdAt"), value: app.createdAt || "-" },
  ];

  if (app.app?.website) {
    rows.push({ label: t("server.apps.drawer.website"), value: app.app.website });
  }
  if (app.app?.document) {
    rows.push({ label: t("server.apps.drawer.document"), value: app.app.document });
  }
  if (app.app?.github) {
    rows.push({ label: t("server.apps.drawer.github"), value: app.app.github });
  }
  if (app.message) {
    rows.push({ label: t("server.apps.drawer.message"), value: app.message });
  }

  return (
    <div className="drawer-section">
      <h4>{t("server.apps.drawer.basicInfo")}</h4>
      <dl className="drawer-kv">
        {rows.map((row) => (
          <div key={row.label} style={{ display: "contents" }}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function LogsTab({
  server,
  app,
  t,
}: {
  server: ServerEntry;
  app: OnePanelInstalledApp;
  t: ReturnType<typeof useI18n>["t"];
}) {
  const { logs, loading, error, refresh, clear } = useAppComposeLogs(server, app, true);

  return (
    <LogViewer
      className="server-app-subwindow__logs"
      text={logs}
      loading={loading}
      loadingText={t("server.apps.drawer.logsLoading")}
      emptyText={t("server.apps.drawer.logsEmpty")}
      error={error}
      onClear={clear}
      toolbar={
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={loading}
          onClick={() => void refresh()}
        >
          {loading ? t("server.apps.loading") : t("server.refresh")}
        </button>
      }
    />
  );
}

function ServerAppSubWindowContent({
  server,
  app,
}: {
  server: ServerEntry;
  app: OnePanelInstalledApp;
}) {
  const { t } = useI18n();
  const [tab, setTab] = useState<AppTab>("detail");

  useEffect(() => {
    setTab("detail");
  }, [app.id]);

  return (
    <div className="server-app-subwindow">
      <div className="server-app-subwindow__tabs">
        <button
          type="button"
          className={`subtab${tab === "detail" ? " active" : ""}`}
          onClick={() => setTab("detail")}
        >
          {t("server.apps.drawer.detail")}
        </button>
        <button
          type="button"
          className={`subtab${tab === "logs" ? " active" : ""}`}
          onClick={() => setTab("logs")}
        >
          {t("server.apps.drawer.logs")}
        </button>
      </div>
      <div className={`server-app-subwindow__body${tab === "logs" ? " server-app-subwindow__body--logs" : ""}`}>
        {tab === "detail" && (
          <div className="server-app-subwindow__detail">
            <DetailTab app={app} t={t} />
          </div>
        )}
        {tab === "logs" && <LogsTab server={server} app={app} t={t} />}
      </div>
    </div>
  );
}

export function ServerAppDrawer({ server, app, onClose }: ServerAppDrawerProps) {
  const displayName = app?.appName || app?.name || app?.appKey || "";

  return (
    <SubWindow
      open={Boolean(app)}
      title={displayName}
      onClose={onClose}
      className="server-app-subwindow-panel"
      widthRatio={0.82}
      heightRatio={0.8}
    >
      {app ? <ServerAppSubWindowContent server={server} app={app} /> : null}
    </SubWindow>
  );
}
