import { useCallback } from "react";

import { useI18n } from "../i18n";
import type { ModuleKey } from "../lib/paths";
import { addModuleRouteToWorkspace } from "../lib/workspaceTabActions";
import { moduleNavI18nKey } from "../lib/workspaceModuleRoutes";
import { useWorkspaceStore } from "../stores/workspaceStore";
import { workspaceAddDebug } from "../lib/workspaceAddDebug";

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
      workspaceAddDebug("useWorkspaceCtrlCopyTab:invoke", {
        moduleKey,
        tabId,
        label,
        workspaceId,
        pathname: typeof window !== "undefined" ? window.location.pathname : null,
      });
      addModuleRouteToWorkspace(workspaceId, moduleKey, label, {
        segmentTabId: tabId,
      });
    },
    [moduleKey, resolveTabLabel, t, workspaceId],
  );
}
