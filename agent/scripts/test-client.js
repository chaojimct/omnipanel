// Simple ACP client for testing
// Usage: node scripts/test-client.js [command] [args...]

const BASE_URL = process.env.ACP_URL || 'http://localhost:3100';

async function testHealth() {
  console.log('Testing health endpoint...');
  const response = await fetch(`${BASE_URL}/api/health`);
  const data = await response.json();
  console.log('Health:', JSON.stringify(data, null, 2));
}

async function testConfig() {
  console.log('\nTesting config endpoint...');
  const response = await fetch(`${BASE_URL}/api/config`);
  const data = await response.json();
  console.log('Config:', JSON.stringify(data, null, 2));
}

async function testTask(input) {
  console.log('\nTesting task execution...');
  const response = await fetch(`${BASE_URL}/api/task`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'execute',
      input: input || 'Say hello and introduce yourself briefly',
    }),
  });
  const data = await response.json();
  console.log('Task result:', JSON.stringify(data, null, 2));
}

async function testConversation(message) {
  console.log('\nTesting conversation...');
  const response = await fetch(`${BASE_URL}/api/conversation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message || 'Hello, how are you?',
      stream: false,
    }),
  });
  const data = await response.json();
  console.log('Conversation:', JSON.stringify(data, null, 2));
}

async function testStreamConversation(message) {
  console.log('\nTesting stream conversation...');
  const response = await fetch(`${BASE_URL}/api/conversation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message || 'Explain quantum computing in simple terms',
      stream: true,
    }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  console.log('Stream response:');
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter((line) => line.startsWith('data: '));
    for (const line of lines) {
      const data = JSON.parse(line.slice(6));
      if (data.message) {
        process.stdout.write(data.message);
      }
    }
  }
  console.log('\n');
}

async function testWebSocket() {
  console.log('\nTesting WebSocket connection...');
  const WebSocket = (await import('ws')).default;

  const ws = new WebSocket('ws://localhost:3100');

  ws.on('open', () => {
    console.log('WebSocket connected');

    // Send a task
    ws.send(
      JSON.stringify({
        id: 'test-1',
        type: 'request',
        method: 'task.execute',
        params: {
          type: 'generate',
          input: 'Write a simple "Hello World" in Python',
        },
      })
    );
  });

  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    console.log('WebSocket message:', JSON.stringify(message, null, 2));

    if (message.method === 'task.completed') {
      ws.close();
    }
  });

  ws.on('close', () => {
    console.log('WebSocket disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error.message);
  });
}

// Main
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'health':
    testHealth();
    break;
  case 'config':
    testConfig();
    break;
  case 'task':
    testTask(arg);
    break;
  case 'chat':
    testConversation(arg);
    break;
  case 'stream':
    testStreamConversation(arg);
    break;
  case 'ws':
    testWebSocket();
    break;
  case 'all':
    testHealth()
      .then(() => testConfig())
      .then(() => testTask())
      .then(() => testConversation())
      .catch(console.error);
    break;
  default:
    console.log(`
OmniPanel Agent Test Client

Usage:
  node scripts/test-client.js <command> [args...]

Commands:
  health    - Test health endpoint
  config    - Test config endpoint
  task      - Test task execution
  chat      - Test conversation
  stream    - Test stream conversation
  ws        - Test WebSocket connection
  all       - Run all tests (except ws and stream)

Examples:
  node scripts/test-client.js health
  node scripts/test-client.js task "Write a fibonacci function"
  node scripts/test-client.js chat "What is AI?"
  node scripts/test-client.js stream "Explain machine learning"
  node scripts/test-client.js ws
    `);
}
