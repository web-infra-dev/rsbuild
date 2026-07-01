import { defaultLogger, isDebug } from '../logger';
import type { LogLevel } from '../types';
import { setupCommands } from './commands';
import { setCommand } from './init';

export type RunCLIOptions = {
  /**
   * The command-line arguments to parse, matching the shape of Node.js `process.argv`
   * @default process.argv
   */
  argv?: string[];
};

function initNodeEnv(command: string | undefined) {
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV =
      command === 'build' || command === 'preview' ? 'production' : 'development';
  }
}

function showGreeting() {
  // Ensure consistent spacing before the greeting message.
  // Different package managers handle output formatting differently - some automatically
  // add a blank line before command output, while others do not.
  const { npm_execpath, npm_lifecycle_event, NODE_RUN_SCRIPT_NAME } = process.env;
  const isNpx = npm_lifecycle_event === 'npx';
  const isBun = npm_execpath?.includes('.bun');
  const isNodeRun = Boolean(NODE_RUN_SCRIPT_NAME);
  const prefix = isNpx || isBun || isNodeRun ? '\n' : '';
  defaultLogger.greet(`${prefix}Rsbuild v${RSBUILD_VERSION}\n`);
}

// ensure log level is set before any log is printed
function setupLogLevel(argv: string[]) {
  if (argv.length <= 3) {
    return;
  }

  const logLevelIndex = argv.findIndex((item) => item === '--log-level' || item === '--logLevel');
  if (logLevelIndex !== -1) {
    const level = argv[logLevelIndex + 1];
    if (level && ['warn', 'error', 'silent'].includes(level) && !isDebug()) {
      defaultLogger.level = level as LogLevel;
    }
  }
}

function parseCommand(argv: string[]): string {
  const commandNames = ['build', 'preview', 'inspect'];
  for (let i = 2; i < argv.length; i++) {
    const command = argv[i];
    if (command && commandNames.includes(command)) {
      return command;
    }
  }
  return 'dev';
}

export function runCLI({ argv = process.argv }: RunCLIOptions = {}): void {
  const command = parseCommand(argv);

  initNodeEnv(command);
  setCommand(command);
  setupLogLevel(argv);
  showGreeting();

  try {
    setupCommands(argv);
  } catch (err) {
    defaultLogger.error('Failed to start Rsbuild CLI.');
    defaultLogger.error(err);
    process.exit(1);
  }
}
