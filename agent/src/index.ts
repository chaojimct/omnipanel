import { OmniPanelAgent } from './core/agent.js';
import { loadConfig, validateConfig } from './core/config.js';
import { ACPServer } from './services/acp-server.js';
import { createLogger } from './services/logger.js';

async function main(): Promise<void> {
  const logger = createLogger('OmniPanelAgent');

  try {
    logger.info('Starting OmniPanel Agent...');

    const config = loadConfig();
    validateConfig(config);

    logger.info(`Agent: ${config.name}`);
    logger.info(`Model: ${config.model.provider}/${config.model.modelName}`);
    logger.info(`ACP Server: ${config.acp.host}:${config.acp.port}`);

    const agent = new OmniPanelAgent(config);

    agent.onEvent((event) => {
      logger.debug(`Agent event: ${event.type}`, event.data);
    });

    const acpServer = new ACPServer(agent, config.acp, logger);
    await acpServer.start();

    logger.info('OmniPanel Agent is ready!');
    logger.info(`Capabilities: ${config.capabilities.join(', ')}`);

    const shutdown = async () => {
      logger.info('Shutting down...');
      await acpServer.stop();
      await agent.shutdown();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      shutdown();
    });
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection:', reason);
    });
  } catch (error) {
    logger.error('Failed to start agent:', error);
    process.exit(1);
  }
}

main();
