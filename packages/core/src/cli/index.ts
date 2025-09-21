import { logger } from '../logger';
import type { LogLevel } from '../types';
import { setupCommands } from './commands';

const { argv } = process;

function initNodeEnv() {
  if (!process.env.NODE_ENV) {
    const command = argv[2];
    process.env.NODE_ENV = ['build', 'preview'].includes(command)
      ? 'production'
      : 'development';
  }
}

function showGreeting() {
  // Ensure consistent spacing before the greeting message.
  // Different package managers handle output formatting differently - some automatically
  // add a blank line before command output, while others do not.
  const { npm_execpath, npm_lifecycle_event, NODE_RUN_SCRIPT_NAME } =
    process.env;
  const isNpx = npm_lifecycle_event === 'npx';
  const isBun = npm_execpath?.includes('.bun');
  const isNodeRun = Boolean(NODE_RUN_SCRIPT_NAME);
  const prefix = isNpx || isBun || isNodeRun ? '\n' : '';
  logger.greet(`${prefix}  Rsbuild v${RSBUILD_VERSION}\n`);
}

// ensure log level is set before any log is printed
function setupLogLevel() {
  const logLevelIndex = process.argv.findIndex(
    (item) => item === '--log-level' || item === '--logLevel',
  );
  if (logLevelIndex !== -1) {
    const level = process.argv[logLevelIndex + 1];
    if (level && ['warn', 'error', 'silent'].includes(level)) {
      logger.level = level as LogLevel;
    }
  }
}

export function runCLI(): void {
  // make it easier to identify the process via activity monitor or other tools
  process.title = 'rsbuild-node';

  initNodeEnv();
  setupLogLevel();
  showGreeting();

  try {
    setupCommands();
  } catch (err) {
    logger.error('Failed to start Rsbuild CLI.');
    logger.error(err);
  }
}
