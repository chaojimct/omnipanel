import { useEffect, useRef } from "react";

export interface ContextMenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
}

export function ContextMenu({ items, position, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent) {
        if (e.key === "Escape") onClose();
        return;
      }
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", handler);
    };
  }, [onClose]);

  const menuStyle: React.CSSProperties = {
    left: position.x,
    top: position.y,
  };

  return (
    <div className="context-menu" ref={ref} style={menuStyle}>
      {items.map((item, i) => (
        <button
          key={i}
          className={`context-menu-item${item.danger ? " context-menu-item--danger" : ""}`}
          disabled={item.disabled}
          onClick={() => {
            item.onClick();
            onClose();
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
