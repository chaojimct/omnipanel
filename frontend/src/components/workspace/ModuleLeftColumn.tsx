import type { ReactNode } from "react";
import { ModuleDockTitle } from "../dock/ModuleDockTitle";

export interface ModuleLeftColumnProps {
  /** 顶栏左侧标题（模块名） */
  title?: ReactNode;
  iconRail?: ReactNode;
  sidebar?: ReactNode;
  className?: string;
}

/** 左侧列：顶栏（对齐终端 session 树标题行）+ 资源侧栏 */
export function ModuleLeftColumn({ title, iconRail, sidebar, className }: ModuleLeftColumnProps) {
  const showHeader = Boolean(title || iconRail);

  return (
    <div className={["module-left-column", className].filter(Boolean).join(" ")}>
      {showHeader ? (
        <div
          className={[
            "module-sidebar-module-header",
            "module-left-column__header",
            iconRail ? "module-left-column__header--with-modes" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {title ? <ModuleDockTitle>{title}</ModuleDockTitle> : null}
          {iconRail ? (
            <div className="module-sidebar-module-header__actions">{iconRail}</div>
          ) : null}
        </div>
      ) : null}
      {sidebar ? <div className="module-left-column__sidebar">{sidebar}</div> : null}
    </div>
  );
}
