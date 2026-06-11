export interface AgentConfig {
  name: string;
  description: string;
  model: {
    provider: 'openai' | 'anthropic' | 'google';
    modelName: string;
    apiKey?: string;
    temperature?: number;
    maxTokens?: number;
  };
  acp: {
    host: string;
    port: number;
    auth?: {
      enabled: boolean;
      token?: string;
    };
  };
  capabilities: AgentCapability[];
  memory?: {
    enabled: boolean;
    maxHistory?: number;
  };
}

export type AgentCapability =
  | 'task_execution'
  | 'conversation'
  | 'code_generation'
  | 'data_analysis'
  | 'file_operation'
  | 'web_search'
  | 'custom';

export interface ACPMessage {
  id: string;
  type: 'request' | 'response' | 'event' | 'error';
  method: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  timestamp: number;
}

export interface TaskRequest {
  taskId: string;
  type: 'execute' | 'analyze' | 'generate' | 'custom';
  input: string | Record<string, unknown>;
  context?: ConversationMessage[];
  options?: {
    timeout?: number;
    priority?: 'low' | 'normal' | 'high';
    callbackUrl?: string;
  };
}

export interface TaskResponse {
  taskId: string;
  status: 'completed' | 'failed' | 'in_progress';
  output: string | Record<string, unknown>;
  artifacts?: Artifact[];
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface ConversationRequest {
  conversationId: string;
  message: string;
  context?: ConversationMessage[];
  stream?: boolean;
}

export interface ConversationResponse {
  conversationId: string;
  message: string;
  done: boolean;
  metadata?: Record<string, unknown>;
}

export interface Artifact {
  type: 'file' | 'code' | 'image' | 'data' | 'url';
  name: string;
  content: string | Buffer;
  mimeType?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentEvent {
  type: 'progress' | 'log' | 'error' | 'complete';
  data: unknown;
  timestamp: number;
}

export interface ACPServerOptions {
  host: string;
  port: number;
  auth?: {
    enabled: boolean;
    token?: string;
  };
  cors?: {
    enabled: boolean;
    origins?: string[];
  };
}

export type EventHandler<T = unknown> = (event: T) => void | Promise<void>;
