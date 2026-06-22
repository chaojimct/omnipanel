import { useCallback } from "react";

import { useI18n } from "../i18n";
import type { ModuleKey } from "../lib/paths";
import { addModuleRouteToWorkspace } from "../lib/workspaceTabActions";
import { moduleNavI18nKey } from "../lib/workspaceModuleRoutes";
import { useWorkspaceStore } from "../stores/workspaceStore";

/**
 * 模块 Dock Ctrl+点击：将当前模块（或指定 segment tab）加入工程工作区。
 */
export function useWorkspaceCtrlCopyTab(
  moduleKey: ModuleKey,
  resolveTabLabel?: (tabId: string) => string,
) {
  const { t } = useI18n();
  const workspaceId = useWorkspaceStore((state) => state.workspace.id);

  return useCallback(
    (tabId: string) => {
      const moduleLabel = t(moduleNavI18nKey(moduleKey));
      const tabLabel = resolveTabLabel?.(tabId);
      const label = tabLabel ? `${moduleLabel} · ${tabLabel}` : moduleLabel;
      addModuleRouteToWorkspace(workspaceId, moduleKey, label, {
        segmentTabId: tabId,
        activate: false,
      });
    },
    [moduleKey, resolveTabLabel, t, workspaceId],
  );
}
