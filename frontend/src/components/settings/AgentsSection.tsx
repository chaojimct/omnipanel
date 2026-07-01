import { useCallback, useEffect, useMemo } from "react";

import { useI18n } from "../../i18n";
import { statusByKind } from "../../lib/agents/detect";
import { AGENT_ADAPTERS } from "../../lib/agents/registry";
import type { AgentKind } from "../../lib/agents/types";
import { formatLaunchCommand } from "../../lib/agents/types";
import {
  getActiveAgentKind,
  useAcpServicesStore,
} from "../../stores/acpServicesStore";
import { isTauriRuntime } from "../../lib/isTauriRuntime";
import { McpServicesSection } from "./McpServicesSection";
import { Button } from "../ui/Button";

export function AgentsSection() {
  const { t } = useI18n();
  const services = useAcpServicesStore((s) => s.services);
  const installStatuses = useAcpServicesStore((s) => s.installStatuses);
  const detecting = useAcpServicesStore((s) => s.detecting);
  const setActive = useAcpServicesStore((s) => s.setActive);
  const refreshDetection = useAcpServicesStore((s) => s.refreshDetection);

  const activeKind = getActiveAgentKind(services);

  useEffect(() => {
    void refreshDetection();
  }, [refreshDetection]);

  const handleSelectAgent = useCallback(
    (kind: AgentKind) => {
      setActive(kind);
    },
    [setActive],
  );

  const statusSummary = useMemo(() => {
    const active = statusByKind(installStatuses, activeKind);
    if (!active?.installed) {
      return t("settings.agents.notFound");
    }
    return t("settings.agents.installed");
  }, [activeKind, installStatuses, t]);

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <div>
          <h2>{t("settings.agents.title")}</h2>
          <p className="section-desc">
            {t("settings.agents.description")} 外部 Agent 通过模型选择器中的{" "}
            <code>acp:*</code> backend 按需连接，无需手动 Connect。
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={detecting || !isTauriRuntime()}
          onClick={() => void refreshDetection()}
        >
          {detecting ? t("settings.agents.detecting") : t("settings.agents.redetect")}
        </Button>
      </div>

      <div className="opencode-detect-status">
        <span className="opencode-detect-status__text">{statusSummary}</span>
      </div>

      <ul className="ai-models-list">
        {AGENT_ADAPTERS.map((adapter) => {
          const status = statusByKind(installStatuses, adapter.kind);
          const isActive = adapter.kind === activeKind;
          const launchCommand = status ? formatLaunchCommand(status) : null;
          const isBuiltin = adapter.kind === "omniagent";

          return (
            <li
              key={adapter.kind}
              className={`ai-provider-card${isActive ? " ai-provider-card--active" : ""}${isBuiltin ? " ai-provider-card--builtin" : ""}`}
            >
              <div className="ai-provider-header">
                <div className="ai-provider-header-main">
                  <span className="ai-provider-expand-placeholder" aria-hidden />
                  <div className="ai-provider-summary">
                    <div className="ai-provider-title-row">
                      <span className="ai-provider-name">{t(adapter.nameKey)}</span>
                      {isBuiltin ? (
                        <span className="ai-model-row-standard ai-model-row-standard-active">
                          {t("settings.acpServices.builtinBadge")}
                        </span>
                      ) : null}
                      <span
                        className={`ai-model-row-standard ${
                          status?.installed
                            ? "ai-model-row-standard-active"
                            : "ai-model-row-standard-openai"
                        }`}
                      >
                        {status?.installed
                          ? t("settings.agents.installed")
                          : t("settings.agents.notFound")}
                      </span>
                      {isActive ? (
                        <span className="ai-model-row-standard ai-model-row-standard-active">
                          {t("settings.acpServices.activeBadge")}
                        </span>
                      ) : null}
                    </div>
                    <div className="ai-model-row-meta">
                      <span className="ai-model-row-baseurl" title={launchCommand ?? undefined}>
                        {launchCommand ?? t("settings.agents.installHint")}
                      </span>
                      {status?.version ? (
                        <>
                          <span className="ai-model-row-sep">·</span>
                          <span className="ai-model-row-key">{status.version}</span>
                        </>
                      ) : null}
                    </div>
                    <p className="section-desc" style={{ marginTop: 4 }}>
                      {t(adapter.descriptionKey)}
                    </p>
                  </div>
                </div>

                <div className="ai-model-row-actions">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`ai-model-row-activate${isActive ? " is-active" : ""}`}
                    disabled={!status?.installed}
                    onClick={() => handleSelectAgent(adapter.kind)}
                    title={
                      isActive
                        ? t("settings.acpServices.activeTitle")
                        : t("settings.acpServices.activateTitle")
                    }
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <path d="M12 2v10" />
                      <path d="M5.6 5.6a9 9 0 1012.8 0" />
                    </svg>
                  </Button>
                </div>
              </div>

              {isActive ? (
                <div className="ai-provider-agent-mcp">
                  <McpServicesSection embedded />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
