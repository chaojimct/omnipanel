import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useI18n } from "../../i18n";
import { SidebarWorkspace } from "../../components/ui/SidebarWorkspace";
import { ModuleSegmentDock } from "../../components/dock";
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
import {
  getVisibleProtocolTabs,
  type ProtocolTabKey,
} from "../../lib/protocolLabConfig";
import { useSettingsStore } from "../../stores/settingsStore";

export function ProtocolPanel() {
  const { t } = useI18n();
  const location = useLocation();
  const isActiveRoute = location.pathname === "/module/protocol";
  const protocolLabTabs = useSettingsStore((s) => s.protocolLabTabs);
  const [active, setActive] = useState<ProtocolTabKey>("http");

  const visibleProtocols = useMemo(
    () => getVisibleProtocolTabs(protocolLabTabs),
    [protocolLabTabs],
  );

  useEffect(() => {
    if (visibleProtocols.includes(active)) {
      return;
    }
    setActive(visibleProtocols[0] ?? "sniffer");
  }, [active, visibleProtocols]);

  const segmentTabs = useMemo(
    () =>
      visibleProtocols.map((id) => ({
        id,
        label: t(`protocol.tabs.${id}`),
      })),
    [t, visibleProtocols],
  );

  const renderPanel = useCallback((tabId: string) => {
    const protocol = tabId as ProtocolTabKey;

    if (protocol === "http") {
      return (
        <ProtocolHttpProvider>
          <ProtocolHttpWorkspace />
        </ProtocolHttpProvider>
      );
    }

    if (protocol === "mqtt") {
      return (
        <MqttProvider>
          <SidebarWorkspace
            layoutPersistKey="protocol-mqtt"
            className="protocol-workspace"
            sidebar={<ProtocolContextSidebar protocol={protocol} />}
          >
            <MqttPanel />
          </SidebarWorkspace>
        </MqttProvider>
      );
    }

    return (
      <SidebarWorkspace
        layoutPersistKey={`protocol-${protocol}`}
        className="protocol-workspace"
        sidebar={<ProtocolContextSidebar protocol={protocol} />}
      >
        {protocol === "pubsub" && <RedisPubSubPanel />}
        {protocol === "serial" && <SerialPanel />}
        {protocol === "grpc" && <GrpcPanel />}
        {protocol === "sniffer" && <SnifferPanel />}
        {protocol === "modbus" && <ModbusPanel />}
      </SidebarWorkspace>
    );
  }, []);

  return (
    <ModuleSegmentDock
      className="protocol-module-dock"
      moduleTitle={t("routes.protocol")}
      tabs={segmentTabs}
      activeTabId={active}
      onActiveTabChange={(id) => setActive(id as ProtocolTabKey)}
      enabled={isActiveRoute}
      renderPanel={renderPanel}
    />
  );
}
