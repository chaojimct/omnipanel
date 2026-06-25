import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { TerminalPane, TerminalTab } from "../../stores/terminalStore";
import type { EnvironmentTag, WorkspaceResource } from "../../lib/resourceRegistry";
import { CommandInput, type CommandInputHandle } from "./CommandInput";
import { TerminalView } from "./TerminalView";
import { type BlueprintSource } from "./sessionBlueprints";

export type TerminalPaneViewHandle = {
  focusInput: () => void;
};

type CommonProps = {
  paneId: string;
  resource: WorkspaceResource | null;
  blueprintSource: BlueprintSource;
  isActive: boolean;
  startup?: string[];
  onActivate: () => void;
  onSendCommand: (command: string) => void;
  onSenderChange: (
    sessionId: string,
    sender: ((cmd: string) => void) | null,
  ) => void;
};

const ENV_BADGE_LABELS: Record<EnvironmentTag, string> = {
  prod: "PROD",
  staging: "STG",
  dev: "DEV",
  local: "LOCAL",
  unknown: "SSH",
};

function parseSshSubtitle(subtitle?: string) {
  const match = subtitle?.match(/^([^@\s]+)@([^:\s]+)(?::(\d+))?/);
  return {
    user: match?.[1],
    host: match?.[2],
    port: match?.[3],
  };
}

function TerminalSessionHeader({
  resource,
  blueprintSource,
}: {
  resource: WorkspaceResource | null;
  blueprintSource: BlueprintSource;
}) {
  if (resource?.type !== "ssh") return null;

  const parsed = parseSshSubtitle(resource.subtitle);
  const user = parsed.user ?? "root";
  const host = parsed.host ?? resource.name;
  const path = "~";
  const shellLabel = resource.tags?.find((tag) => /bash|zsh|fish|powershell/i.test(tag)) ?? "bash";
  const osLabel =
    resource.tags?.find((tag) => /ubuntu|debian|centos|linux|windows|macos/i.test(tag)) ??
    resource.metrics?.OS ??
    "Ubuntu 22.04";
  const hardwareLabel =
    resource.metrics?.配置 ??
    resource.metrics?.Hardware ??
    resource.metrics?.硬件 ??
    "32C/128G";

  return (
    <div className="term-session-header">
      <span className={`term-session-env term-session-env--${resource.environment}`}>
        {ENV_BADGE_LABELS[resource.environment] ?? "SSH"}
      </span>
      <span className="term-session-host">{user}@{resource.name}</span>
      <span className="term-session-muted">:</span>
      <span className="term-session-path">{path}</span>
      {parsed.port ? <span className="term-session-muted">· {host}:{parsed.port}</span> : null}
      <span className="term-session-spacer" />
      <span className="term-session-meta">
        {shellLabel} · {osLabel} · {blueprintSource.type === "remote" ? hardwareLabel : "本地"}
      </span>
    </div>
  );
}

function PaneViewBody(
  {
    paneId,
    resource,
    blueprintSource,
    isActive,
    startup = [],
    onActivate,
    onSendCommand,
    onSenderChange,
    currentResourceId,
  }: CommonProps & { currentResourceId: string },
  ref: React.ForwardedRef<TerminalPaneViewHandle>,
) {
  const cmdRef = useRef<CommandInputHandle>(null);

  useImperativeHandle(ref, () => ({
    focusInput: () => {
      cmdRef.current?.focus();
    },
  }));

  useEffect(() => {
    if (isActive) {
      cmdRef.current?.focus();
    }
  }, [isActive]);

  const focusCommandInput = () => {
    requestAnimationFrame(() => {
      cmdRef.current?.focus();
    });
  };

  return (
    <div
      className={`term-pane term-pane-leaf${isActive ? " is-active" : ""}`}
      data-pane-id={paneId}
      onMouseDown={onActivate}
    >
      <TerminalSessionHeader resource={resource} blueprintSource={blueprintSource} />
      <div
        className="terminal-area term-terminal-shell"
        tabIndex={-1}
        onMouseDownCapture={(event) => {
          onActivate();
          event.preventDefault();
          focusCommandInput();
        }}
        onClick={focusCommandInput}
      >
        <TerminalView
          key={`${paneId}:${blueprintSource.type ?? "local"}:${currentResourceId}`}
          sessionId={paneId}
          resource={resource}
          startup={startup}
          active={isActive}
          onSenderChange={onSenderChange}
        />
      </div>
      <CommandInput ref={cmdRef} onSend={onSendCommand} />
    </div>
  );
}

const ForwardedBody = forwardRef<TerminalPaneViewHandle, CommonProps & { currentResourceId: string }>(
  PaneViewBody,
);

export type TerminalTabPaneViewProps = Omit<CommonProps, "blueprintSource"> & {
  tab: TerminalTab;
};

/** 顶层终端 Tab 的 PaneView（单会话） */
export const TerminalTabPaneView = forwardRef<TerminalPaneViewHandle, TerminalTabPaneViewProps>(
  function TerminalTabPaneView(props, ref) {
    const { tab, resource, ...rest } = props;
    return (
      <ForwardedBody
        ref={ref}
        {...rest}
        resource={resource}
        blueprintSource={tab.session}
        currentResourceId={tab.session.resourceId}
      />
    );
  },
);

export type TerminalPaneViewProps = Omit<CommonProps, "blueprintSource" | "currentResourceId"> & {
  pane: TerminalPane;
};

/** SSH 内嵌多 Pane 视图（保持向后兼容） */
export const TerminalPaneView = forwardRef<TerminalPaneViewHandle, TerminalPaneViewProps>(
  function TerminalPaneView(props, ref) {
    const { pane, resource, ...rest } = props;
    return (
      <ForwardedBody
        ref={ref}
        {...rest}
        resource={resource}
        blueprintSource={pane}
        currentResourceId={pane.resourceId}
      />
    );
  },
);
