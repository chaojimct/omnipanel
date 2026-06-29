import type { ReactNode } from "react";
import { DockTabIcon, type DockTabIconKind } from "../dock/DockTabIcon";

export interface ModuleModeIconItem {
  id: string;
  label: string;
  icon?: DockTabIconKind;
  /** 自定义图标节点（优先于 icon） */
  iconNode?: ReactNode;
  disabled?: boolean;
}

export interface ModuleModeIconRailProps {
  items: ModuleModeIconItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

/** 模块左侧顶栏横向功能模式图标（A 类：查询/文库/HTTP 等） */
export function ModuleModeIconRail({
  items,
  activeId,
  onChange,
  className,
}: ModuleModeIconRailProps) {
  return (
    <nav
      className={["module-mode-icon-rail", className].filter(Boolean).join(" ")}
      aria-label="模块功能模式"
    >
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            className={`module-mode-icon-rail__btn${active ? " module-mode-icon-rail__btn--active" : ""}`}
            title={item.label}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            disabled={item.disabled}
            onClick={() => onChange(item.id)}
          >
            {item.iconNode ?? (item.icon ? <DockTabIcon kind={item.icon} /> : null)}
          </button>
        );
      })}
    </nav>
  );
}
