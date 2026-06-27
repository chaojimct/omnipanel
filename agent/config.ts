import fs from "node:fs";
import path from "node:path";

/** OmniPanel 写入的 agent 配置文件结构（app_data_dir/acp-agent-config.json）。 */
export type OmniAgentConfigFile = {
  version?: number;
  model: string;
  apiKey: string;
  baseUrl: string;
  apiStandard: "openai" | "anthropic";
};

let cachedConfig: OmniAgentConfigFile | null | undefined;

function resolveConfigPath(): string | null {
  const fromEnv = process.env.OMNIAGENT_CONFIG?.trim();
  if (fromEnv) return fromEnv;
  return null;
}

/** 读取 OmniPanel 写入的配置文件；未设置 OMNIAGENT_CONFIG 时返回 null。 */
export function loadAgentConfigFile(): OmniAgentConfigFile | null {
  if (cachedConfig !== undefined) {
    return cachedConfig;
  }

  const configPath = resolveConfigPath();
  if (!configPath) {
    cachedConfig = null;
    return null;
  }

  try {
    const raw = fs.readFileSync(configPath, "utf8");
    const parsed = JSON.parse(raw) as OmniAgentConfigFile;
    if (!parsed.model?.trim() || !parsed.apiKey?.trim() || !parsed.baseUrl?.trim()) {
      log("配置文件缺少 model/apiKey/baseUrl:", configPath);
      cachedConfig = null;
      return null;
    }
    cachedConfig = {
      version: parsed.version ?? 1,
      model: parsed.model.trim(),
      apiKey: parsed.apiKey.trim(),
      baseUrl: parsed.baseUrl.trim().replace(/\/+$/, ""),
      apiStandard: parsed.apiStandard === "anthropic" ? "anthropic" : "openai",
    };
    log("已加载配置:", path.basename(configPath), cachedConfig.model);
    return cachedConfig;
  } catch (error) {
    log("读取配置失败:", configPath, error);
    cachedConfig = null;
    return null;
  }
}

/** 将配置应用到进程环境变量，供 LangChain / DeepAgents 使用。 */
export function applyAgentConfigToEnv(config: OmniAgentConfigFile): void {
  if (config.apiStandard === "anthropic") {
    process.env.ANTHROPIC_API_KEY = config.apiKey;
    process.env.ANTHROPIC_BASE_URL = config.baseUrl;
    return;
  }

  process.env.OPENAI_API_KEY = config.apiKey;
  process.env.OPENAI_BASE_URL = config.baseUrl;
  process.env.OPENAI_API_BASE = config.baseUrl;
}

/** LangChain model 字符串，例如 openai:gpt-4o-mini */
export function resolveLangChainModelId(config: OmniAgentConfigFile): string {
  const provider = config.apiStandard === "anthropic" ? "anthropic" : "openai";
  return `${provider}:${config.model}`;
}

function log(...args: unknown[]): void {
  console.error("[omniagent:config]", ...args);
}
