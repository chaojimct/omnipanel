# OmniPanel Agent

OmniPanel 的智能体模块，基于 DeepAgents 和 LangChain 实现，支持 ACP (Agent Communication Protocol) 连接。

## 功能特性

- 🤖 **多模型支持**: 支持 OpenAI、Anthropic、Google 等多种 LLM 提供商
- 💬 **对话交互**: 支持流式和非流式对话
- ⚡ **任务执行**: 支持异步任务执行和取消
- 🔌 **ACP 协议**: 同时支持 HTTP REST API 和 WebSocket 连接
- 🔐 **安全认证**: 可选的 token 认证机制
- 📝 **会话记忆**: 自动管理对话历史
- 📊 **事件系统**: 实时推送 agent 事件

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入你的 API Key
```

### 启动服务

```bash
# 开发模式（自动重载）
npm run dev

# 生产模式
npm run build
npm start
```

## ACP 连接方式

### HTTP REST API

#### 执行任务

```bash
curl -X POST http://localhost:3100/api/task \
  -H "Content-Type: application/json" \
  -d '{
    "type": "execute",
    "input": "帮我写一个快速排序算法"
  }'
```

#### 对话交互

```bash
curl -X POST http://localhost:3100/api/conversation \
  -H "Content-Type: application/json" \
  -d '{
    "message": "你好，请介绍一下你自己",
    "stream": false
  }'
```

#### 流式对话

```bash
curl -X POST http://localhost:3100/api/conversation \
  -H "Content-Type: application/json" \
  -N \
  -d '{
    "message": "解释一下量子计算",
    "stream": true
  }'
```

### WebSocket 连接

```javascript
const ws = new WebSocket('ws://localhost:3100');

ws.onopen = () => {
  // 发送任务请求
  ws.send(JSON.stringify({
    id: '1',
    type: 'request',
    method: 'task.execute',
    params: {
      type: 'generate',
      input: '写一个 Hello World 程序'
    }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

#### WebSocket 方法

| 方法 | 说明 |
|------|------|
| `task.execute` | 执行任务 |
| `conversation.send` | 发送对话消息 |
| `task.cancel` | 取消任务 |
| `ping` | 心跳检测 |

## API 响应格式

### 任务响应

```json
{
  "taskId": "uuid",
  "status": "completed",
  "output": "任务输出内容",
  "metadata": {
    "model": "gpt-4o-mini",
    "type": "execute",
    "duration": 1234
  }
}
```

### 对话响应

```json
{
  "conversationId": "uuid",
  "message": "回复内容",
  "done": true,
  "metadata": {
    "model": "gpt-4o-mini",
    "messageCount": 4
  }
}
```

## 配置说明

| 环境变量 | 说明 | 默认值 |
|---------|------|--------|
| `AGENT_NAME` | Agent 名称 | OmniPanel Agent |
| `MODEL_PROVIDER` | 模型提供商 | openai |
| `MODEL_NAME` | 模型名称 | gpt-4o-mini |
| `MODEL_API_KEY` | API 密钥 | - |
| `ACP_HOST` | 监听地址 | 0.0.0.0 |
| `ACP_PORT` | 监听端口 | 3100 |
| `ACP_AUTH_ENABLED` | 启用认证 | false |
| `ACP_AUTH_TOKEN` | 认证 token | - |
| `MEMORY_ENABLED` | 启用记忆 | true |
| `MEMORY_MAX_HISTORY` | 最大历史数 | 100 |

## 在 OmniPanel 中集成

OmniPanel 前端可以通过以下方式连接到 Agent：

```typescript
// HTTP API
const response = await fetch('http://localhost:3100/api/task', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'execute',
    input: '你的任务描述'
  })
});

// WebSocket
const ws = new WebSocket('ws://localhost:3100');
```

## 开发

```bash
# 运行测试
npm test

# 代码检查
npm run lint

# 构建
npm run build
```

## 许可证

MIT
