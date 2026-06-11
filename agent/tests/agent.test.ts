import { OmniPanelAgent } from '../src/core/agent.js';
import { AgentConfig } from '../src/types/index.js';

const mockConfig: AgentConfig = {
  name: 'Test Agent',
  description: 'A test agent',
  model: {
    provider: 'openai',
    modelName: 'gpt-4o-mini',
    apiKey: 'test-key',
    temperature: 0.7,
    maxTokens: 1024,
  },
  acp: {
    host: 'localhost',
    port: 3100,
  },
  capabilities: ['task_execution', 'conversation'],
};

describe('OmniPanelAgent', () => {
  let agent: OmniPanelAgent;

  beforeEach(() => {
    agent = new OmniPanelAgent(mockConfig);
  });

  afterEach(async () => {
    await agent.shutdown();
  });

  test('should create agent with config', () => {
    expect(agent).toBeDefined();
    expect(agent.getConfig()).toEqual(mockConfig);
  });

  test('should return 0 active tasks initially', () => {
    expect(agent.getActiveTaskCount()).toBe(0);
  });

  test('should return empty conversation history', () => {
    expect(agent.getConversationHistory('test')).toEqual([]);
  });

  test('should cancel non-existent task returns false', () => {
    expect(agent.cancelTask('non-existent')).toBe(false);
  });

  test('should clear conversation history', () => {
    agent.clearConversationHistory('test');
    expect(agent.getConversationHistory('test')).toEqual([]);
  });
});
