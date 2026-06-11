import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import {
  AgentConfig,
  TaskRequest,
  TaskResponse,
  ConversationRequest,
  ConversationResponse,
  ConversationMessage,
  AgentEvent,
  EventHandler,
} from '../types/index.js';

export class OmniPanelAgent extends EventEmitter {
  private config: AgentConfig;
  private model: ChatOpenAI;
  private conversationHistory: Map<string, ConversationMessage[]> = new Map();
  private activeTasks: Map<string, AbortController> = new Map();

  constructor(config: AgentConfig) {
    super();
    this.config = config;
    this.model = this.initializeModel();
  }

  private initializeModel(): ChatOpenAI {
    const { model } = this.config;
    return new ChatOpenAI({
      modelName: model.modelName,
      temperature: model.temperature ?? 0.7,
      maxTokens: model.maxTokens ?? 4096,
      openAIApiKey: model.apiKey ?? process.env.OPENAI_API_KEY,
    });
  }

  async executeTask(request: TaskRequest): Promise<TaskResponse> {
    const { taskId, type, input, context, options } = request;
    const abortController = new AbortController();
    this.activeTasks.set(taskId, abortController);

    this.emitEvent({
      type: 'progress',
      data: { taskId, status: 'started', type },
      timestamp: Date.now(),
    });

    try {
      const systemPrompt = this.buildSystemPrompt(type);
      const messages = this.buildMessages(systemPrompt, context, typeof input === 'string' ? input : JSON.stringify(input));

      const prompt = ChatPromptTemplate.fromMessages([
        new SystemMessage(systemPrompt),
        new MessagesPlaceholder('history'),
        new HumanMessage('{input}'),
      ]);

      const chain = prompt.pipe(this.model).pipe(new StringOutputParser());

      const history = (context ?? []).map((msg) => {
        if (msg.role === 'user') return new HumanMessage(msg.content);
        if (msg.role === 'assistant') return new AIMessage(msg.content);
        return new SystemMessage(msg.content);
      });

      const output = await chain.invoke(
        {
          history,
          input: typeof input === 'string' ? input : JSON.stringify(input, null, 2),
        },
        { signal: abortController.signal }
      );

      const response: TaskResponse = {
        taskId,
        status: 'completed',
        output,
        metadata: {
          model: this.config.model.modelName,
          type,
          duration: Date.now() - request.timestamp,
        },
      };

      this.emitEvent({
        type: 'complete',
        data: response,
        timestamp: Date.now(),
      });

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('abort')) {
        return {
          taskId,
          status: 'failed',
          output: '',
          error: 'Task was cancelled',
        };
      }

      this.emitEvent({
        type: 'error',
        data: { taskId, error: errorMessage },
        timestamp: Date.now(),
      });

      return {
        taskId,
        status: 'failed',
        output: '',
        error: errorMessage,
      };
    } finally {
      this.activeTasks.delete(taskId);
    }
  }

  async *streamConversation(request: ConversationRequest): AsyncGenerator<ConversationResponse> {
    const { conversationId, message, context, stream = true } = request;

    const history = this.conversationHistory.get(conversationId) ?? context ?? [];
    history.push({
      role: 'user',
      content: message,
      timestamp: Date.now(),
    });

    const systemPrompt = this.buildSystemPrompt('conversation');
    const prompt = ChatPromptTemplate.fromMessages([
      new SystemMessage(systemPrompt),
      new MessagesPlaceholder('history'),
      new HumanMessage('{input}'),
    ]);

    const chain = prompt.pipe(this.model).pipe(new StringOutputParser());

    const langchainHistory = history.map((msg) => {
      if (msg.role === 'user') return new HumanMessage(msg.content);
      if (msg.role === 'assistant') return new AIMessage(msg.content);
      return new SystemMessage(msg.content);
    });

    if (stream) {
      let fullResponse = '';
      const stream = await chain.stream({
        history: langchainHistory,
        input: message,
      });

      for await (const chunk of stream) {
        fullResponse += chunk;
        yield {
          conversationId,
          message: chunk,
          done: false,
        };
      }

      history.push({
        role: 'assistant',
        content: fullResponse,
        timestamp: Date.now(),
      });

      this.conversationHistory.set(conversationId, history);

      yield {
        conversationId,
        message: '',
        done: true,
        metadata: {
          model: this.config.model.modelName,
          messageCount: history.length,
        },
      };
    } else {
      const output = await chain.invoke({
        history: langchainHistory,
        input: message,
      });

      history.push({
        role: 'assistant',
        content: output,
        timestamp: Date.now(),
      });

      this.conversationHistory.set(conversationId, history);

      yield {
        conversationId,
        message: output,
        done: true,
        metadata: {
          model: this.config.model.modelName,
          messageCount: history.length,
        },
      };
    }
  }

  cancelTask(taskId: string): boolean {
    const controller = this.activeTasks.get(taskId);
    if (controller) {
      controller.abort();
      this.activeTasks.delete(taskId);
      return true;
    }
    return false;
  }

  getConversationHistory(conversationId: string): ConversationMessage[] {
    return this.conversationHistory.get(conversationId) ?? [];
  }

  clearConversationHistory(conversationId: string): void {
    this.conversationHistory.delete(conversationId);
  }

  getActiveTaskCount(): number {
    return this.activeTasks.size;
  }

  getConfig(): AgentConfig {
    return { ...this.config };
  }

  private buildSystemPrompt(taskType: string): string {
    const basePrompt = `You are ${this.config.name}, an AI agent part of the OmniPanel ecosystem.
${this.config.description}

Capabilities: ${this.config.capabilities.join(', ')}`;

    const taskPrompts: Record<string, string> = {
      execute: `${basePrompt}
You excel at executing tasks efficiently. Break down complex tasks into steps, execute them methodically, and provide clear results.
Always explain your reasoning and provide actionable outputs.`,

      analyze: `${basePrompt}
You are an analytical expert. When analyzing data or code, provide:
1. Clear structure and organization
2. Key findings and insights
3. Potential issues or improvements
4. Actionable recommendations`,

      generate: `${basePrompt}
You are a code and content generation expert. When generating code:
1. Follow best practices and conventions
2. Include proper error handling
3. Add clear comments and documentation
4. Consider edge cases and security`,

      conversation: `${basePrompt}
You are a helpful conversational assistant. Be concise, clear, and friendly.
Adapt your communication style to the user's needs.
If you're unsure about something, acknowledge it honestly.`,

      custom: basePrompt,
    };

    return taskPrompts[taskType] ?? taskPrompts.custom;
  }

  private buildMessages(
    systemPrompt: string,
    context?: ConversationMessage[],
    input?: string
  ): Array<SystemMessage | HumanMessage | AIMessage> {
    const messages: Array<SystemMessage | HumanMessage | AIMessage> = [
      new SystemMessage(systemPrompt),
    ];

    if (context) {
      for (const msg of context) {
        if (msg.role === 'user') {
          messages.push(new HumanMessage(msg.content));
        } else if (msg.role === 'assistant') {
          messages.push(new AIMessage(msg.content));
        }
      }
    }

    if (input) {
      messages.push(new HumanMessage(input));
    }

    return messages;
  }

  private emitEvent(event: AgentEvent): void {
    this.emit('event', event);
  }

  onEvent(handler: EventHandler<AgentEvent>): void {
    this.on('event', handler);
  }

  async shutdown(): Promise<void> {
    for (const [taskId, controller] of this.activeTasks) {
      controller.abort();
      this.activeTasks.delete(taskId);
    }
    this.conversationHistory.clear();
    this.removeAllListeners();
  }
}
