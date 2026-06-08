import { useEffect, useRef } from "react";
import {
  useTopbarStore,
  type TopbarHandlers,
  type TopbarTabDef,
  type TopbarTabOptions,
} from "../stores/topbarStore";

export function useTopbarTabs(
  tabs: TopbarTabDef[],
  handlers: TopbarHandlers,
  options: TopbarTabOptions = {}
) {
  const handlerRef = useRef(handlers);
  handlerRef.current = handlers;
  const setTabs = useTopbarStore((s) => s.setTabs);
  const clearTabs = useTopbarStore((s) => s.clearTabs);

  const { mode, showAddTab, addTabTitle, enabled = true } = options;
  const addMenuItems = handlers.addMenuItems;

  useEffect(() => {
    if (!enabled) {
      // 不注册顶栏 Tab，也不清除——父级模块可能仍持有顶栏（如服务器「面板/终端」）
      return;
    }
    setTabs(
      tabs,
      {
        onSelect: (id) => handlerRef.current.onSelect?.(id),
        onClose: (id) => handlerRef.current.onClose?.(id),
        onAdd: () => handlerRef.current.onAdd?.(),
        addMenuItems: handlerRef.current.addMenuItems,
        onAddMenuSelect: (id) => handlerRef.current.onAddMenuSelect?.(id),
      },
      { mode, showAddTab, addTabTitle }
    );
    return () => clearTabs();
  }, [tabs, addMenuItems, mode, showAddTab, addTabTitle, enabled, setTabs, clearTabs]);
}
