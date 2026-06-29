import { useCallback, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useI18n } from "../../i18n";
import { ModuleSegmentDock } from "../../components/dock";
import { ModuleModeIconRail, ModuleWorkspaceLayout } from "../../components/workspace";
import { ProtocolHttpWorkspace } from "./ProtocolHttpWorkspace";
import { MqttPanel } from "./MqttPanel";
import { MqttProvider } from "./MqttContext";
import { RedisPubSubPanel } from "./RedisPubSubPanel";
import { SerialPanel } from "./SerialPanel";
import { GrpcPanel } from "./GrpcPanel";
import { SnifferPanel } from "./SnifferPanel";
import { ModbusPanel } from "./ModbusPanel";
import { ProtocolContextSidebar } from "./ProtocolContextSidebar";
import { ProtocolHttpProvider } from "./ProtocolHttpContext";
import { ProtocolHttpSidebar } from "./ProtocolHttpSidebar";
import {
  getVisibleProtocolTabs,
  type ProtocolTabKey,
} from "../../lib/protocolLabConfig";
import { useSettingsStore } from "../../stores/settingsStore";
import { usePersistedModuleTab } from "../../hooks/usePersistedModuleTab";

function protocolIconLabel(key: ProtocolTabKey): string {
  const map: Record<ProtocolTabKey, string> = {
    http: "HTTP",
    mqtt: "MQ",
    pubsub: "PS",
    serial: "SR",
    grpc: "gR",
    sniffer: "SN",
    modbus: "MB",
  };
  return map[key];
}

function ProtocolIconNode({ label }: { label: string }) {
  return <span className="module-mode-icon-rail__text-icon">{label}</span>;
}

export function ProtocolPanel() {
  const { t } = useI18n();
  const location = useLocation();
  const isActiveRoute = location.pathname === "/module/protocol";
  const protocolLabTabs = useSettingsStore((s) => s.protocolLabTabs);

  const visibleProtocols = useMemo(
    () => getVisibleProtocolTabs(protocolLabTabs),
    [protocolLabTabs],
  );

  const [active, setActive] = usePersistedModuleTab(
    "protocol",
    "http",
    visibleProtocols.length > 0 ? visibleProtocols : (["sniffer"] as ProtocolTabKey[]),
  );

  useEffect(() => {
    if (visibleProtocols.includes(active)) return;
    setActive(visibleProtocols[0] ?? "sniffer");
  }, [active, setActive, visibleProtocols]);

  const modeIconItems = useMemo(
    () =>
      visibleProtocols.map((id) => ({
        id,
        label: t(`protocol.tabs.${id}`),
        iconNode: <ProtocolIconNode label={protocolIconLabel(id)} />,
      })),
    [t, visibleProtocols],
  );

  const leftSidebar = useMemo(() => {
    if (active === "http") {
      return <ProtocolHttpSidebar />;
    }
    return <ProtocolContextSidebar protocol={active} />;
  }, [active]);

  const renderNonHttpPanel = useCallback((tabId: string) => {
    const protocol = tabId as ProtocolTabKey;
    if (protocol === "mqtt") {
      return <MqttPanel />;
    }
    if (protocol === "pubsub") return <RedisPubSubPanel />;
    if (protocol === "serial") return <SerialPanel />;
    if (protocol === "grpc") return <GrpcPanel />;
    if (protocol === "sniffer") return <SnifferPanel />;
    if (protocol === "modbus") return <ModbusPanel />;
    return null;
  }, []);

  const segmentTabs = useMemo(
    () => [{ id: active, label: t(`protocol.tabs.${active}`) }],
    [active, t],
  );

  const mainContent =
    active === "http" ? (
      <ProtocolHttpWorkspace
        moduleTitle={t("routes.protocol")}
        enabled={isActiveRoute}
        windowControl
      />
    ) : (
      <ModuleSegmentDock
        className="protocol-module-dock"
        variant="function"
        moduleTitle={t("routes.protocol")}
        enabled={isActiveRoute}
        windowControl
        showTabBar={false}
        tabs={segmentTabs}
        activeTabId={active}
        onActiveTabChange={() => {}}
        renderPanel={renderNonHttpPanel}
      />
    );

  const layout = (
    <ModuleWorkspaceLayout
      layoutKey={`protocol-${active}`}
      className="protocol-module-layout"
      leftColumnTitle={t("routes.protocol")}
      leftIconRail={
        <ModuleModeIconRail
          items={modeIconItems}
          activeId={active}
          onChange={(id) => setActive(id as ProtocolTabKey)}
        />
      }
      leftSidebar={leftSidebar}
    >
      {mainContent}
    </ModuleWorkspaceLayout>
  );

  if (active === "http") {
    return <ProtocolHttpProvider>{layout}</ProtocolHttpProvider>;
  }
  if (active === "mqtt") {
    return <MqttProvider>{layout}</MqttProvider>;
  }
  return layout;
}
