import { logger } from '../logger';
import type { LogLevel } from '../types';
import { setupCommands } from './commands';

function initNodeEnv() {
  if (!process.env.NODE_ENV) {
    const command = process.argv[2];
    process.env.NODE_ENV = ['build', 'preview'].includes(command)
      ? 'production'
      : 'development';
  }
}

export async function runCLI(): Promise<void> {
  initNodeEnv();

  // make it easier to identify the process via activity monitor or other tools
  process.title = 'rsbuild-node';

  // ensure log level is set before any log is printed
  const logLevelIndex = process.argv.findIndex(
    (item) => item === '--log-level' || item === '--logLevel',
  );
  if (logLevelIndex !== -1) {
    const level = process.argv[logLevelIndex + 1];
    if (level && ['warn', 'error', 'silent'].includes(level)) {
      logger.level = level as LogLevel;
    }
  }

  // Print a blank line to keep the greet log nice.
  // Some package managers automatically output a blank line, some do not.
  const { npm_execpath } = process.env;
  if (
    !npm_execpath ||
    npm_execpath.includes('npx-cli.js') ||
    npm_execpath.includes('.bun')
  ) {
    logger.log();
  }

  logger.greet(`  ${`Rsbuild v${RSBUILD_VERSION}`}\n`);

  try {
    setupCommands();
  } catch (err) {
    logger.error('Failed to start Rsbuild CLI.');
    logger.error(err);
  }
}
