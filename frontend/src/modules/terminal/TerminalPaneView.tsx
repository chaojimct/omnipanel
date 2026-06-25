import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { TerminalPane, TerminalSessionInfo, TerminalTab } from "../../stores/terminalStore";
import type { EnvironmentTag, WorkspaceResource } from "../../lib/resourceRegistry";
import { CommandInput, type CommandInputHandle } from "./CommandInput";
import { TerminalView } from "./TerminalView";
import { type BlueprintSource } from "./sessionBlueprints";
import {
  buildSessionMetaLine,
  formatTerminalCwdDisplay,
  parseSshSubtitle,
  resolveCommandPromptSymbol,
} from "./terminalSessionDisplay";
import { useTerminalSessionStats } from "./useTerminalSessionStats";

export type TerminalPaneViewHandle = {
  focusInput: () => void;
};

type CommonProps = {
  paneId: string;
  session: TerminalSessionInfo;
  resource: WorkspaceResource | null;
  blueprintSource: BlueprintSource;
  isActive: boolean;
  connected: boolean;
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

function TerminalSessionHeader({
  resource,
  session,
  connected,
}: {
  resource: WorkspaceResource | null;
  session: TerminalSessionInfo;
  connected: boolean;
}) {
  const stats = useTerminalSessionStats(session.resourceId, connected);
  const parsed = parseSshSubtitle(resource?.subtitle);
  const user = parsed.user ?? (session.type === "local" ? null : "root");
  const path = formatTerminalCwdDisplay(session.cwd, user);
  const meta = buildSessionMetaLine(session, resource, stats);
  const hostAddress =
    parsed.host && parsed.port ? `${parsed.host}:${parsed.port}` : parsed.host;

  if (session.type === "local") {
    const hostLabel = stats?.hostName?.trim() || resource?.name || "本地终端";
    return (
      <div className="term-session-header">
        <span className="term-session-env term-session-env--local">
          {ENV_BADGE_LABELS.local}
        </span>
        <span className="term-session-host">{hostLabel}</span>
        <span className="term-session-muted">:</span>
        <span className="term-session-path">{path}</span>
        <span className="term-session-spacer" />
        {meta ? <span className="term-session-meta">{meta}</span> : null}
      </div>
    );
  }

  if (resource?.type !== "ssh") return null;

  return (
    <div className="term-session-header">
      <span className={`term-session-env term-session-env--${resource.environment}`}>
        {ENV_BADGE_LABELS[resource.environment] ?? "SSH"}
      </span>
      <span className="term-session-host">
        {user ?? "root"}@{resource.name}
      </span>
      <span className="term-session-muted">:</span>
      <span className="term-session-path">{path}</span>
      {hostAddress ? (
        <span className="term-session-muted">· {hostAddress}</span>
      ) : null}
      <span className="term-session-spacer" />
      {meta ? <span className="term-session-meta">{meta}</span> : null}
    </div>
  );
}

function PaneViewBody(
  {
    paneId,
    session,
    resource,
    blueprintSource,
    isActive,
    connected,
    startup = [],
    onActivate,
    onSendCommand,
    onSenderChange,
    currentResourceId,
  }: CommonProps & { currentResourceId: string },
  ref: React.ForwardedRef<TerminalPaneViewHandle>,
) {
  const cmdRef = useRef<CommandInputHandle>(null);
  const parsed = parseSshSubtitle(resource?.subtitle);
  const promptSymbol = resolveCommandPromptSymbol(session, parsed.user, resource);

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
      <TerminalSessionHeader
        resource={resource}
        session={session}
        connected={connected}
      />
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
      <CommandInput ref={cmdRef} promptSymbol={promptSymbol} onSend={onSendCommand} />
    </div>
  );
}

const ForwardedBody = forwardRef<
  TerminalPaneViewHandle,
  CommonProps & { currentResourceId: string }
>(PaneViewBody);

export type TerminalTabPaneViewProps = Omit<
  CommonProps,
  "blueprintSource" | "session" | "connected"
> & {
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
        session={tab.session}
        resource={resource}
        connected={tab.status === "connected"}
        blueprintSource={tab.session}
        currentResourceId={tab.session.resourceId}
      />
    );
  },
);

export type TerminalPaneViewProps = Omit<
  CommonProps,
  "blueprintSource" | "currentResourceId" | "session" | "connected"
> & {
  pane: TerminalPane;
};

/** SSH 内嵌多 Pane 视图（保持向后兼容） */
export const TerminalPaneView = forwardRef<TerminalPaneViewHandle, TerminalPaneViewProps>(
  function TerminalPaneView(props, ref) {
    const { pane, resource, ...rest } = props;
    const session: TerminalSessionInfo = {
      type: pane.type,
      resourceId: pane.resourceId,
      shellLabel: pane.shellLabel,
      cwd: pane.cwd,
      purpose: pane.purpose,
      commandPack: pane.commandPack,
    };
    return (
      <ForwardedBody
        ref={ref}
        {...rest}
        session={session}
        resource={resource}
        connected={pane.status === "connected"}
        blueprintSource={pane}
        currentResourceId={pane.resourceId}
      />
    );
  },
);
