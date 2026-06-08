import type { DetailTab } from "./types";

/** SSH 工作区已并入服务器模块，资源上下文路径与 `/server` 一致 */
export const SSH_PATH = "/server";

export const DETAIL_TABS: DetailTab[] = [
  "overview",
  "terminal",
  "sftp",
  "tunnels",
  "monitoring",
];
