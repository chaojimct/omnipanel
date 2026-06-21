import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  defaultHeightForMode,
  dragModeFromHeight,
  halfHeightPx,
  isEmbeddedWorkspaceMode,
  resolveEmbeddedHeight,
  WS_HEIGHT_HIDDEN_MAX,
  type EmbeddedWorkspaceMode,
  type WorkspaceMode,
} from "../lib/workspaceMode";

/** @deprecated 兼容旧逻辑，映射到 hidden/half */
export type WorkspaceEmbeddedMode = "off" | "half";

interface BottomPanelState {
  expandSignal: number;
  collapseSignal: number;
  /** 当前工作区模式 */
  workspaceMode: WorkspaceMode;
  /** 底部嵌入区实际高度（px） */
  workspaceHeightPx: number;
  /** 离开全屏前记住的嵌入模式 */
  lastNonFullscreenMode: EmbeddedWorkspaceMode;

  /** 底部工作区是否展开（嵌入态且非 hidden） */
  isOpen: boolean;
  /** 是否全屏（工程工作区） */
  isFullscreen: boolean;
  /** @deprecated 首页已移除，始终为 false */
  isHomeActive: boolean;
  /** @deprecated 使用 lastNonFullscreenMode */
  embeddedMode: WorkspaceEmbeddedMode;

  requestExpand: () => void;
  requestCollapse: () => void;
  setIsOpen: (open: boolean) => void;
  setWorkspaceHeight: (
    heightPx: number,
    options?: { fromUserDrag?: boolean; commit?: boolean },
  ) => void;
  enterFullscreen: () => void;
  /** @deprecated 首页已移除，等同于 enterWorkspaceFullscreen */
  enterHomeWorkspace: () => void;
  enterWorkspaceFullscreen: () => void;
  exitFullscreen: () => void;
  leaveFullscreenForFeature: () => void;
  /** @deprecated 首页已移除，等同于 leaveFullscreenForFeature */
  leaveHomeToFeature: () => void;
  /** @deprecated 首页已移除，等同于 enterWorkspaceFullscreen */
  exitHomeToWorkspace: () => void;
  applyEmbeddedMode: () => void;
  toggleFullscreen: () => void;
  toggleEmbeddedWorkspace: () => void;
  toggleOpen: () => void;
  /** 全屏顶栏向下拖拽退出全屏，固定恢复半屏 */
  leaveFullscreenByDrag: () => void;
  /** 半屏及以下右上角：进入工程工作区全屏 */
  handleWorkspaceChromeIcon: () => void;
}

function normalizeWorkspaceMode(mode: WorkspaceMode): WorkspaceMode {
  return mode === "home" ? "fullscreen" : mode;
}

function syncDerivedFlags(mode: WorkspaceMode): Pick<
  BottomPanelState,
  "isOpen" | "isFullscreen" | "isHomeActive" | "embeddedMode"
> {
  const normalized = normalizeWorkspaceMode(mode);
  const isFullscreen = normalized === "fullscreen";
  const isOpen = isEmbeddedWorkspaceMode(normalized) && normalized !== "hidden";
  const embeddedMode: WorkspaceEmbeddedMode =
    normalized === "half" || normalized === "thumbnail" || normalized === "taskbar"
      ? "half"
      : "off";
  return { isOpen, isFullscreen, isHomeActive: false, embeddedMode };
}

export const useBottomPanelStore = create<BottomPanelState>()(
  persist(
    (set, get) => ({
      expandSignal: 0,
      collapseSignal: 0,
      workspaceMode: "hidden",
      workspaceHeightPx: 0,
      lastNonFullscreenMode: "half",
      isOpen: false,
      isFullscreen: false,
      isHomeActive: false,
      embeddedMode: "off",

      requestExpand: () => {
        const { lastNonFullscreenMode } = get();
        const mode: EmbeddedWorkspaceMode =
          lastNonFullscreenMode === "taskbar" ||
          lastNonFullscreenMode === "thumbnail"
            ? lastNonFullscreenMode
            : "half";
        const height = defaultHeightForMode(mode);
        set((state) => ({
          expandSignal: state.expandSignal + 1,
          workspaceMode: mode,
          workspaceHeightPx: height,
          lastNonFullscreenMode: mode,
          ...syncDerivedFlags(mode),
        }));
      },

      requestCollapse: () => {
        const { workspaceMode, lastNonFullscreenMode } = get();
        const normalized = normalizeWorkspaceMode(workspaceMode);
        const remembered =
          isEmbeddedWorkspaceMode(normalized) && normalized !== "hidden"
            ? normalized
            : lastNonFullscreenMode;
        set((state) => ({
          collapseSignal: state.collapseSignal + 1,
          workspaceMode: "hidden",
          workspaceHeightPx: 0,
          lastNonFullscreenMode: remembered,
          ...syncDerivedFlags("hidden"),
        }));
      },

      setIsOpen: (isOpen) => {
        if (isOpen) {
          get().requestExpand();
        } else {
          get().requestCollapse();
        }
      },

      setWorkspaceHeight: (heightPx, options) => {
        const { workspaceMode } = get();
        const normalized = normalizeWorkspaceMode(workspaceMode);
        if (normalized === "fullscreen") return;

        const currentEmbedded = isEmbeddedWorkspaceMode(normalized)
          ? normalized
          : undefined;

        if (options?.commit === false) {
          const liveMode = dragModeFromHeight(heightPx, currentEmbedded);
          if (liveMode === normalized) return;
          set({ workspaceMode: liveMode, ...syncDerivedFlags(liveMode) });
          return;
        }

        const { mode: nextMode, height: normalizedHeight } = resolveEmbeddedHeight(heightPx);
        const patch: Partial<BottomPanelState> = {
          workspaceHeightPx: normalizedHeight,
          workspaceMode: nextMode,
          ...syncDerivedFlags(nextMode),
        };
        if (nextMode !== "hidden") {
          patch.lastNonFullscreenMode = nextMode;
        }
        set(patch);
      },

      enterFullscreen: () => {
        get().enterWorkspaceFullscreen();
      },

      enterHomeWorkspace: () => {
        get().enterWorkspaceFullscreen();
      },

      enterWorkspaceFullscreen: () => {
        set((state) => ({
          workspaceMode: "fullscreen",
          expandSignal: state.expandSignal + 1,
          ...syncDerivedFlags("fullscreen"),
        }));
      },

      exitHomeToWorkspace: () => {
        get().enterWorkspaceFullscreen();
      },

      applyEmbeddedMode: () => {
        const { lastNonFullscreenMode } = get();
        const mode: EmbeddedWorkspaceMode =
          lastNonFullscreenMode === "hidden" ? "half" : lastNonFullscreenMode;
        const height = defaultHeightForMode(mode);
        set((state) => ({
          expandSignal: state.expandSignal + 1,
          workspaceMode: mode,
          workspaceHeightPx: height,
          ...syncDerivedFlags(mode),
        }));
      },

      exitFullscreen: () => {
        get().applyEmbeddedMode();
      },

      leaveFullscreenForFeature: () => {
        const { workspaceMode } = get();
        if (normalizeWorkspaceMode(workspaceMode) !== "fullscreen") return;
        get().applyEmbeddedMode();
      },

      leaveHomeToFeature: () => {
        get().leaveFullscreenForFeature();
      },

      leaveFullscreenByDrag: () => {
        const halfHeight = halfHeightPx();
        set({
          workspaceMode: "half",
          workspaceHeightPx: halfHeight,
          lastNonFullscreenMode: "half",
          ...syncDerivedFlags("half"),
        });
        set((state) => ({ expandSignal: state.expandSignal + 1 }));
      },

      handleWorkspaceChromeIcon: () => {
        const { workspaceMode } = get();
        if (normalizeWorkspaceMode(workspaceMode) === "fullscreen") {
          get().exitFullscreen();
          return;
        }
        get().enterWorkspaceFullscreen();
      },

      toggleFullscreen: () => {
        const { workspaceMode } = get();
        if (normalizeWorkspaceMode(workspaceMode) === "fullscreen") {
          get().exitFullscreen();
        } else {
          get().enterWorkspaceFullscreen();
        }
      },

      toggleEmbeddedWorkspace: () => {
        const { workspaceMode } = get();
        const normalized = normalizeWorkspaceMode(workspaceMode);
        if (normalized === "hidden") {
          get().requestExpand();
        } else if (isEmbeddedWorkspaceMode(normalized)) {
          get().requestCollapse();
        }
      },

      toggleOpen: () => {
        const { workspaceMode } = get();
        const normalized = normalizeWorkspaceMode(workspaceMode);
        if (normalized === "fullscreen") {
          get().exitFullscreen();
          return;
        }
        if (normalized === "hidden") {
          const height = defaultHeightForMode("half");
          set((state) => ({
            expandSignal: state.expandSignal + 1,
            workspaceMode: "half",
            workspaceHeightPx: height,
            lastNonFullscreenMode: "half",
            ...syncDerivedFlags("half"),
          }));
        } else {
          get().requestCollapse();
        }
      },
    }),
    {
      name: "omnipanel-bottom-panel",
      version: 3,
      partialize: (state) => ({
        lastNonFullscreenMode: state.lastNonFullscreenMode,
        workspaceHeightPx: state.workspaceHeightPx,
        embeddedMode: state.embeddedMode,
      }),
      migrate: (persisted, version) => {
        const p = persisted as Record<string, unknown> | undefined;
        if (!p || version >= 3) return persisted as unknown as BottomPanelState;
        const legacyEmbedded = p.embeddedMode === "half" ? "half" : "off";
        const lastNonFullscreenMode: EmbeddedWorkspaceMode = "half";
        const workspaceHeightPx =
          typeof p.workspaceHeightPx === "number"
            ? p.workspaceHeightPx
            : defaultHeightForMode("half");
        const workspaceMode: WorkspaceMode =
          legacyEmbedded === "half" ? "half" : "hidden";
        return {
          ...p,
          lastNonFullscreenMode,
          workspaceHeightPx: legacyEmbedded === "half" ? workspaceHeightPx : 0,
          workspaceMode,
          embeddedMode: legacyEmbedded,
          isHomeActive: false,
        } as BottomPanelState;
      },
      merge: (persisted, current) => {
        const p = persisted as Partial<BottomPanelState> | undefined;
        if (!p) return current;
        const merged = { ...current, ...p };
        if (p.embeddedMode === "half") {
          const mode: EmbeddedWorkspaceMode =
            p.lastNonFullscreenMode && p.lastNonFullscreenMode !== "hidden"
              ? p.lastNonFullscreenMode
              : "half";
          merged.workspaceMode = mode;
          const rawHeight =
            typeof p.workspaceHeightPx === "number" && p.workspaceHeightPx > WS_HEIGHT_HIDDEN_MAX
              ? p.workspaceHeightPx
              : defaultHeightForMode(mode);
          merged.workspaceHeightPx = resolveEmbeddedHeight(rawHeight).height;
          Object.assign(merged, syncDerivedFlags(mode));
        } else {
          merged.workspaceMode = "hidden";
          merged.workspaceHeightPx = 0;
          Object.assign(merged, syncDerivedFlags("hidden"));
        }
        if (merged.workspaceMode === "home") {
          merged.workspaceMode = "hidden";
          Object.assign(merged, syncDerivedFlags("hidden"));
        }
        merged.isHomeActive = false;
        return merged;
      },
    },
  ),
);

/** 当前嵌入态（非全屏时） */
export function useEmbeddedWorkspaceMode(): EmbeddedWorkspaceMode {
  const mode = useBottomPanelStore((s) => s.workspaceMode);
  const normalized = normalizeWorkspaceMode(mode);
  if (isEmbeddedWorkspaceMode(normalized)) return normalized;
  return "hidden";
}
