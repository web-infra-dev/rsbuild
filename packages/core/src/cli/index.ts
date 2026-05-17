import { defaultLogger, isDebug } from '../logger';
import type { LogLevel } from '../types';
import { setupCommands } from './commands';

const { argv } = process;

function initNodeEnv(command: string | undefined) {
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV =
      command === 'build' || command === 'preview'
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
  defaultLogger.greet(`${prefix}Rsbuild v${RSBUILD_VERSION}\n`);
}

// ensure log level is set before any log is printed
function setupLogLevel() {
  if (argv.length <= 3) {
    return;
  }

  const logLevelIndex = argv.findIndex(
    (item) => item === '--log-level' || item === '--logLevel',
  );
  if (logLevelIndex !== -1) {
    const level = process.argv[logLevelIndex + 1];
    if (level && ['warn', 'error', 'silent'].includes(level) && !isDebug()) {
      defaultLogger.level = level as LogLevel;
    }
  }
}

export function runCLI(): void {
  const command = argv[2];

  initNodeEnv(command);
  setupLogLevel();
  showGreeting();

  try {
    setupCommands();
  } catch (err) {
    defaultLogger.error('Failed to start Rsbuild CLI.');
    defaultLogger.error(err);
    process.exit(1);
  }
}
