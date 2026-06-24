/**
 * 工作区面板添加 API（三种情况）：
 *
 * 1. 顶级模块路由 — addModuleRouteToWorkspace / useWorkspaceCtrlCopyTab
 * 2. 子面板/组件（参数快照）— addComponentToWorkspace + registerWorkspaceComponent
 * 3. 单个组件 — 用 WorkspaceComponent 包裹，等同情况 2
 */
export { WorkspaceComponent } from "../components/workspace/WorkspaceComponent";
export type { WorkspaceComponentRootProps } from "../components/workspace/WorkspaceComponent";
export {
  addModuleRouteToWorkspace,
  addComponentToWorkspace,
  addSnapshotToWorkspace,
} from "./workspaceTabActions";
export {
  registerWorkspaceComponent,
  buildComponentSnapshot,
  buildComponentSnapshotId,
  getWorkspaceComponentDefinition,
  isComponentSnapshot,
  type ComponentSnapshot,
  type WorkspaceComponentDefinition,
  type WorkspaceComponentProps,
} from "./workspaceComponentTypes";
export {
  workspaceComponentRegistry,
  renderWorkspaceComponent,
  resolveWorkspaceComponentPreviewKind,
  moduleSegmentComponentType,
} from "./workspaceComponentRegistry";
