import type { TerminalSessionType } from "../../stores/terminalStore";
import {
  resolveAbsoluteTerminalCwd,
  splitTerminalPathCrumbs,
  terminalCdCommand,
} from "./terminalPathCrumbs";

type TerminalPathBreadcrumbProps = {
  cwd: string;
  user?: string | null;
  sessionType?: TerminalSessionType;
  onRunCommand?: (command: string) => void;
  variant?: "header" | "block";
};

export function TerminalPathBreadcrumb({
  cwd,
  user,
  sessionType = "remote",
  onRunCommand,
  variant = "header",
}: TerminalPathBreadcrumbProps) {
  const crumbs = splitTerminalPathCrumbs(cwd, user, sessionType);

  const navigate = (path: string) => {
    if (!onRunCommand) return;
    const absolute =
      path.startsWith("/") || path.startsWith("~") || /^[A-Za-z]:/.test(path)
        ? path
        : resolveAbsoluteTerminalCwd(path, user);
    onRunCommand(terminalCdCommand(absolute));
  };
  const unixRootTrail =
    sessionType !== "local" &&
    crumbs.length > 0 &&
    crumbs[0]?.label === "/" &&
    crumbs[0]?.path === "/";
  const unixSegments = unixRootTrail ? crumbs.slice(1) : crumbs;

  const renderCrumbButton = (crumb: (typeof crumbs)[number], isCurrent: boolean) => (
    <button
      type="button"
      className={`term-path-crumb${isCurrent ? " is-current" : ""}`}
      onClick={() => navigate(crumb.path)}
      disabled={!onRunCommand}
      title={onRunCommand ? terminalCdCommand(crumb.path) : crumb.path}
    >
      {crumb.label}
    </button>
  );

  return (
    <div className={`term-path-nav term-path-nav--${variant}`}>
      <div className="term-path-crumbs">
        {unixRootTrail ? (
          <>
            <span className="term-path-crumb-segment">
              {renderCrumbButton(crumbs[0]!, unixSegments.length === 0)}
            </span>
            {unixSegments.map((crumb, index) => (
              <span key={`${crumb.path}:${index}`} className="term-path-crumb-segment">
                {index > 0 ? <span className="term-path-crumb-sep">/</span> : null}
                {renderCrumbButton(crumb, index === unixSegments.length - 1)}
              </span>
            ))}
          </>
        ) : (
          crumbs.map((crumb, index) => (
            <span key={`${crumb.path}:${index}`} className="term-path-crumb-segment">
              {index > 0 && crumb.label !== "/" ? (
                <span className="term-path-crumb-sep">/</span>
              ) : null}
              {renderCrumbButton(crumb, index === crumbs.length - 1)}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
