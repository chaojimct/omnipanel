import { config } from 'dotenv';
import { AgentConfig } from '../types/index.js';

config();

export function loadConfig(): AgentConfig {
  return {
    name: process.env.AGENT_NAME ?? 'OmniPanel Agent',
    description:
      process.env.AGENT_DESCRIPTION ?? 'An intelligent AI agent for the OmniPanel ecosystem',
    model: {
      provider: (process.env.MODEL_PROVIDER as 'openai' | 'anthropic' | 'google') ?? 'openai',
      modelName: process.env.MODEL_NAME ?? 'gpt-4o-mini',
      apiKey: process.env.MODEL_API_KEY ?? process.env.OPENAI_API_KEY,
      temperature: process.env.MODEL_TEMPERATURE ? parseFloat(process.env.MODEL_TEMPERATURE) : 0.7,
      maxTokens: process.env.MODEL_MAX_TOKENS ? parseInt(process.env.MODEL_MAX_TOKENS) : 4096,
    },
    acp: {
      host: process.env.ACP_HOST ?? '0.0.0.0',
      port: process.env.ACP_PORT ? parseInt(process.env.ACP_PORT) : 3100,
      auth: {
        enabled: process.env.ACP_AUTH_ENABLED === 'true',
        token: process.env.ACP_AUTH_TOKEN,
      },
    },
    capabilities: (process.env.AGENT_CAPABILITIES?.split(',') as AgentConfig['capabilities']) ?? [
      'task_execution',
      'conversation',
      'code_generation',
    ],
    memory: {
      enabled: process.env.MEMORY_ENABLED !== 'false',
      maxHistory: process.env.MEMORY_MAX_HISTORY ? parseInt(process.env.MEMORY_MAX_HISTORY) : 100,
    },
  };
}

export function validateConfig(config: AgentConfig): void {
  if (!config.model.apiKey) {
    throw new Error('Model API key is required. Set MODEL_API_KEY or OPENAI_API_KEY environment variable.');
  }

  if (config.acp.port < 0 || config.acp.port > 65535) {
    throw new Error('ACP port must be between 0 and 65535');
  }

  if (config.acp.auth?.enabled && !config.acp.auth.token) {
    throw new Error('ACP auth token is required when auth is enabled');
  }
}
