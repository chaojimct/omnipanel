import { WebSocketServer, WebSocket } from 'ws';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from 'winston';
import { OmniPanelAgent } from '../core/agent.js';
import {
  ACPServerOptions,
  ACPMessage,
  TaskRequest,
  ConversationRequest,
  AgentEvent,
} from '../types/index.js';

export class ACPServer {
  private app: express.Application;
  private server: http.Server | null = null;
  private wss: WebSocketServer | null = null;
  private agent: OmniPanelAgent;
  private options: ACPServerOptions;
  private logger: Logger;
  private clients: Map<string, WebSocket> = new Map();

  constructor(agent: OmniPanelAgent, options: ACPServerOptions, logger: Logger) {
    this.agent = agent;
    this.options = options;
    this.logger = logger;
    this.app = express();
    this.setupExpress();
    this.setupAgentEvents();
  }

  private setupExpress(): void {
    if (this.options.cors?.enabled) {
      this.app.use(
        cors({
          origin: this.options.cors.origins ?? '*',
        })
      );
    }

    this.app.use(express.json());

    if (this.options.auth?.enabled) {
      this.app.use(this.authMiddleware.bind(this));
    }

    this.app.post('/api/task', this.handleTaskRequest.bind(this));
    this.app.post('/api/conversation', this.handleConversationRequest.bind(this));
    this.app.get('/api/health', this.handleHealthCheck.bind(this));
    this.app.get('/api/config', this.handleConfigRequest.bind(this));
    this.app.delete('/api/task/:taskId', this.handleCancelTask.bind(this));
  }

  private authMiddleware(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token || token !== this.options.auth?.token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or missing authentication token',
      });
      return;
    }

    next();
  }

  private async handleTaskRequest(req: Request, res: Response): Promise<void> {
    try {
      const taskRequest: TaskRequest = {
        ...req.body,
        taskId: req.body.taskId ?? uuidv4(),
      };

      this.logger.info(`Received task request: ${taskRequest.taskId}`);

      const result = await this.agent.executeTask(taskRequest);
      res.json(result);
    } catch (error) {
      this.logger.error('Task request failed:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async handleConversationRequest(req: Request, res: Response): Promise<void> {
    try {
      const conversationRequest: ConversationRequest = {
        ...req.body,
        conversationId: req.body.conversationId ?? uuidv4(),
      };

      this.logger.info(`Received conversation request: ${conversationRequest.conversationId}`);

      if (conversationRequest.stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const stream = this.agent.streamConversation(conversationRequest);

        for await (const chunk of stream) {
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }

        res.end();
      } else {
        const stream = this.agent.streamConversation(conversationRequest);
        let lastResponse;

        for await (const chunk of stream) {
          lastResponse = chunk;
        }

        res.json(lastResponse);
      }
    } catch (error) {
      this.logger.error('Conversation request failed:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private handleHealthCheck(_req: Request, res: Response): void {
    res.json({
      status: 'healthy',
      timestamp: Date.now(),
      activeTasks: this.agent.getActiveTaskCount(),
      connectedClients: this.clients.size,
    });
  }

  private handleConfigRequest(_req: Request, res: Response): void {
    const config = this.agent.getConfig();
    res.json({
      name: config.name,
      description: config.description,
      capabilities: config.capabilities,
      model: {
        provider: config.model.provider,
        modelName: config.model.modelName,
      },
    });
  }

  private handleCancelTask(req: Request, res: Response): void {
    const { taskId } = req.params;
    const cancelled = this.agent.cancelTask(taskId);

    if (cancelled) {
      res.json({ success: true, message: `Task ${taskId} cancelled` });
    } else {
      res.status(404).json({
        success: false,
        message: `Task ${taskId} not found or already completed`,
      });
    }
  }

  private setupWebSocket(): void {
    if (!this.server) return;

    this.wss = new WebSocketServer({ server: this.server });

    this.wss.on('connection', (ws: WebSocket, req) => {
      const clientId = uuidv4();
      this.clients.set(clientId, ws);

      this.logger.info(`WebSocket client connected: ${clientId}`);

      if (this.options.auth?.enabled) {
        const url = new URL(req.url ?? '', `http://${req.headers.host}`);
        const token = url.searchParams.get('token');

        if (token !== this.options.auth.token) {
          ws.close(1008, 'Unauthorized');
          this.clients.delete(clientId);
          return;
        }
      }

      ws.on('message', async (data: Buffer) => {
        try {
          const message: ACPMessage = JSON.parse(data.toString());
          await this.handleWebSocketMessage(clientId, message);
        } catch (error) {
          this.logger.error(`WebSocket message handling error for ${clientId}:`, error);
          this.sendToClient(clientId, {
            id: uuidv4(),
            type: 'error',
            method: 'error',
            error: {
              code: -32700,
              message: 'Parse error',
            },
            timestamp: Date.now(),
          });
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        this.logger.info(`WebSocket client disconnected: ${clientId}`);
      });

      ws.on('error', (error) => {
        this.logger.error(`WebSocket error for ${clientId}:`, error);
        this.clients.delete(clientId);
      });

      this.sendToClient(clientId, {
        id: uuidv4(),
        type: 'event',
        method: 'connected',
        result: {
          clientId,
          agentName: this.agent.getConfig().name,
          capabilities: this.agent.getConfig().capabilities,
        },
        timestamp: Date.now(),
      });
    });
  }

  private async handleWebSocketMessage(clientId: string, message: ACPMessage): Promise<void> {
    this.logger.info(`WebSocket message from ${clientId}: ${message.method}`);

    switch (message.method) {
      case 'task.execute': {
        const request = message.params as unknown as TaskRequest;
        request.taskId = request.taskId ?? message.id;

        this.sendToClient(clientId, {
          id: message.id,
          type: 'response',
          method: 'task.accepted',
          result: { taskId: request.taskId, status: 'accepted' },
          timestamp: Date.now(),
        });

        const result = await this.agent.executeTask(request);
        this.sendToClient(clientId, {
          id: message.id,
          type: 'response',
          method: 'task.completed',
          result,
          timestamp: Date.now(),
        });
        break;
      }

      case 'conversation.send': {
        const request = message.params as unknown as ConversationRequest;
        request.conversationId = request.conversationId ?? message.id;
        request.stream = true;

        const stream = this.agent.streamConversation(request);

        for await (const chunk of stream) {
          this.sendToClient(clientId, {
            id: message.id,
            type: 'response',
            method: 'conversation.chunk',
            result: chunk,
            timestamp: Date.now(),
          });
        }
        break;
      }

      case 'task.cancel': {
        const { taskId } = message.params as { taskId: string };
        const cancelled = this.agent.cancelTask(taskId);
        this.sendToClient(clientId, {
          id: message.id,
          type: 'response',
          method: 'task.cancelled',
          result: { taskId, cancelled },
          timestamp: Date.now(),
        });
        break;
      }

      case 'ping': {
        this.sendToClient(clientId, {
          id: message.id,
          type: 'response',
          method: 'pong',
          timestamp: Date.now(),
        });
        break;
      }

      default: {
        this.sendToClient(clientId, {
          id: message.id,
          type: 'error',
          method: message.method,
          error: {
            code: -32601,
            message: `Method not found: ${message.method}`,
          },
          timestamp: Date.now(),
        });
      }
    }
  }

  private sendToClient(clientId: string, message: ACPMessage): void {
    const client = this.clients.get(clientId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  private broadcastToClients(message: ACPMessage): void {
    for (const [clientId, client] of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    }
  }

  private setupAgentEvents(): void {
    this.agent.onEvent((event: AgentEvent) => {
      this.broadcastToClients({
        id: uuidv4(),
        type: 'event',
        method: `agent.${event.type}`,
        result: event.data,
        timestamp: event.timestamp,
      });
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.options.port, this.options.host, () => {
        this.logger.info(
          `ACP Server listening on ${this.options.host}:${this.options.port}`
        );

        this.setupWebSocket();
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    for (const [, client] of this.clients) {
      client.close(1000, 'Server shutting down');
    }
    this.clients.clear();

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    if (this.server) {
      return new Promise((resolve, reject) => {
        this.server!.close((err) => {
          if (err) {
            reject(err);
          } else {
            this.server = null;
            this.logger.info('ACP Server stopped');
            resolve();
          }
        });
      });
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }
}
