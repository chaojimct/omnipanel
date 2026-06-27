import type { ModuleKey } from "../../paths";
import type { McpToolInfo } from "../../../ipc/bindings";
import { DATABASE_MODULE_MCP_TOOLS } from "../../../modules/database/ai/mcpTools";
import { TERMINAL_MODULE_MCP_TOOLS } from "../../../modules/terminal/ai/mcpTools";
import type { McpToolRegistration } from "./types";

/** 与 Rust `BUILTIN_SERVICE_ID` 保持一致 */
export const OMNIMCP_BUILTIN_SERVICE_ID = "omnimcp-builtin";
/** 内置 OmniMCP HTTP 固定端口，与 Rust `BUILTIN_MCP_PORT` 一致 */
export const OMNIMCP_BUILTIN_MCP_PORT = 12756;
export const OMNIMCP_BUILTIN_MCP_URL = `http://127.0.0.1:${OMNIMCP_BUILTIN_MCP_PORT}/mcp`;

const MODULE_MCP_CATALOG: Partial<Record<ModuleKey, McpToolRegistration[]>> = {
  database: DATABASE_MODULE_MCP_TOOLS,
  terminal: TERMINAL_MODULE_MCP_TOOLS,
};

export function getModuleMcpToolsFromCatalog(moduleKey: ModuleKey): McpToolRegistration[] {
  return MODULE_MCP_CATALOG[moduleKey] ?? [];
}

/** 供设置页 OmniMCP 工具列表合并展示 */
export function getAllModuleMcpToolInfos(): McpToolInfo[] {
  const items: McpToolInfo[] = [];
  for (const tools of Object.values(MODULE_MCP_CATALOG)) {
    if (!tools) continue;
    for (const tool of tools) {
      items.push({
        name: tool.name,
        description: tool.description,
      });
    }
  }
  return items;
}
