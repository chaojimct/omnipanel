import path from "node:path";
import { fileURLToPath } from "node:url";
import type { McpServer } from "@agentclientprotocol/sdk";
import type { DynamicStructuredTool } from "@langchain/core/tools";
import { MemorySaver } from "@langchain/langgraph";
import { MultiServerMCPClient, type ClientConfig, type Connection } from "@langchain/mcp-adapters";
import { createDeepAgent, type DeepAgent } from "deepagents";
import {
  applyAgentConfigToEnv,
  loadAgentConfigFile,
  resolveLangChainModelId,
  resolveMcpServersFromConfig,
} from "./config.js";

const agentRoot = path.dirname(fileURLToPath(import.meta.url));

export type SessionRuntime = {
  sessionId: string;
  cwd: string;
  graph: DeepAgent;
  mcpClient: MultiServerMCPClient | null;
};

function envVarsToRecord(env: Array<{ name: string; value: string }>): Record<string, string> {
  return Object.fromEntries(env.map((item) => [item.name, item.value]));
}

function headersToRecord(headers: Array<{ name: string; value: string }>): Record<string, string> {
  return Object.fromEntries(headers.map((item) => [item.name, item.value]));
}

/** Skills 目录：可用 OMNIAGENT_SKILLS_DIRS（PATH 分隔）覆盖。 */
export function resolveSkillsDirs(): string[] {
  const fromEnv = process.env.OMNIAGENT_SKILLS_DIRS;
  if (fromEnv?.trim()) {
    return fromEnv
      .split(path.delimiter)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [path.join(agentRoot, "skills")];
}

/**
 * 将 OmniPanel / ACP 的 MCP 列表转为 @langchain/mcp-adapters 标准 ClientConfig。
 * @see https://docs.langchain.com/oss/javascript/deepagents/tools#mcp-tools
 */
export function buildMcpClientConfig(servers: McpServer[]): ClientConfig | null {
  const mcpServers: Record<string, Connection> = {};

  for (const server of servers) {
    if ("command" in server && typeof server.command === "string") {
      mcpServers[server.name] = {
        transport: "stdio",
        command: server.command,
        args: server.args ?? [],
        env: envVarsToRecord(server.env ?? []),
      };
      continue;
    }

    if (!("url" in server) || typeof server.url !== "string" || !server.url.trim()) {
      continue;
    }

    const headers = headersToRecord("headers" in server ? (server.headers ?? []) : []);
    const serverType = "type" in server ? server.type : undefined;

    if (serverType === "sse") {
      mcpServers[server.name] = {
        transport: "sse",
        url: server.url,
        headers,
      };
      continue;
    }

    // Streamable HTTP（ACP type=http 或未标注 type 的 URL 服务）
    mcpServers[server.name] = {
      transport: "http",
      url: server.url,
      headers,
    };
  }

  if (Object.keys(mcpServers).length === 0) {
    return null;
  }

  return {
    onConnectionError: "ignore",
    mcpServers,
  };
}

export async function createSessionRuntime(
  sessionId: string,
  cwd: string,
  mcpServersFromSession: McpServer[] = [],
): Promise<SessionRuntime> {
  const skills = resolveSkillsDirs();
  let mcpClient: MultiServerMCPClient | null = null;
  let mcpTools: DynamicStructuredTool[] = [];

  const configMcpServers = resolveMcpServersFromConfig();
  const mcpServers =
    mcpServersFromSession.length > 0 ? mcpServersFromSession : configMcpServers;
  const mcpClientConfig = buildMcpClientConfig(mcpServers);
  if (mcpClientConfig) {
    try {
      mcpClient = new MultiServerMCPClient(mcpClientConfig);
      mcpTools = await mcpClient.getTools();
      console.error(
        "[omniagent:runtime] MCP 已连接:",
        Object.keys(mcpClientConfig.mcpServers ?? {}).join(", "),
        "tools=",
        mcpTools.length,
      );
    } catch (error) {
      console.error("[omniagent:runtime] MCP 工具加载失败，继续无 MCP 运行:", error);
      await mcpClient?.close().catch(() => {});
      mcpClient = null;
      mcpTools = [];
    }
  } else {
    console.error("[omniagent:runtime] 未配置 MCP 服务（session 与配置文件均为空）");
  }

  const fileConfig = loadAgentConfigFile();
  if (!fileConfig) {
    throw new Error(
      "未找到 OmniPanel agent 配置。请在 OmniPanel「设置 → Agent」中配置模型与 API，并连接 Agent。",
    );
  }

  applyAgentConfigToEnv(fileConfig);
  const model = resolveLangChainModelId(fileConfig);

  const graph = createDeepAgent({
    model,
    tools: mcpTools,
    skills,
    checkpointer: new MemorySaver(),
    systemPrompt:
      process.env.OMNIAGENT_SYSTEM_PROMPT ??
      "你是 OmniPanel 本地编码助手。按需读取 Skills、调用 MCP 工具完成任务。回答简洁、可执行。",
  });

  return { sessionId, cwd, graph, mcpClient };
}

export async function disposeSessionRuntime(runtime: SessionRuntime): Promise<void> {
  if (runtime.mcpClient) {
    await runtime.mcpClient.close();
  }
}
