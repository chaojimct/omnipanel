import path from "node:path";
import { fileURLToPath } from "node:url";
import type { McpServer } from "@agentclientprotocol/sdk";
import type { DynamicStructuredTool } from "@langchain/core/tools";
import { MultiServerMCPClient, type Connection } from "@langchain/mcp-adapters";
import { createDeepAgent, FilesystemBackend, type DeepAgent } from "deepagents";

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

/** 将 ACP session/new 中的 MCP 配置转为 @langchain/mcp-adapters 连接。 */
export function acpMcpServersToConnections(servers: McpServer[]): Record<string, Connection> {
  const connections: Record<string, Connection> = {};

  for (const server of servers) {
    if ("command" in server && typeof server.command === "string") {
      connections[server.name] = {
        transport: "stdio",
        command: server.command,
        args: server.args ?? [],
        env: envVarsToRecord(server.env ?? []),
      };
      continue;
    }

    if ("type" in server && server.type === "http" && "url" in server) {
      connections[server.name] = {
        url: server.url,
        headers: headersToRecord(server.headers ?? []),
      };
      continue;
    }

    if ("type" in server && server.type === "sse" && "url" in server) {
      connections[server.name] = {
        url: server.url,
        headers: headersToRecord(server.headers ?? []),
        transport: "sse",
      };
    }
  }

  return connections;
}

export async function createSessionRuntime(
  sessionId: string,
  cwd: string,
  mcpServers: McpServer[],
): Promise<SessionRuntime> {
  const skills = resolveSkillsDirs();
  let mcpClient: MultiServerMCPClient | null = null;
  let mcpTools: DynamicStructuredTool[] = [];

  const connections = acpMcpServersToConnections(mcpServers);
  if (Object.keys(connections).length > 0) {
    mcpClient = new MultiServerMCPClient(connections);
    mcpTools = await mcpClient.getTools();
  }

  const model =
    process.env.OMNIAGENT_MODEL ?? `openai:${process.env.OPENAI_MODEL ?? "gpt-4o-mini"}`;

  const graph = createDeepAgent({
    model,
    tools: mcpTools,
    skills,
    systemPrompt:
      process.env.OMNIAGENT_SYSTEM_PROMPT ??
      "你是 OmniPanel 本地编码助手。按需读取 Skills、调用 MCP 工具与文件系统工具完成任务。回答简洁、可执行。",
    backend: () =>
      new FilesystemBackend({
        rootDir: cwd,
        virtualMode: false,
      }),
  });

  return { sessionId, cwd, graph, mcpClient };
}

export async function disposeSessionRuntime(runtime: SessionRuntime): Promise<void> {
  if (runtime.mcpClient) {
    await runtime.mcpClient.close();
  }
}
