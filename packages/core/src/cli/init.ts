import path from 'node:path';
import { createRsbuildInternal } from '../createRsbuild';
import { castArray } from '../helpers';
import { ensureAbsolutePath } from '../helpers/path';
import { loadConfig as baseLoadConfig } from '../loadConfig';
import { defaultLogger } from '../logger';
import type { RestartContext, RsbuildInstance } from '../types';
import type { CommonOptions } from './commands';

export type CommandName = 'dev' | 'build' | 'preview' | 'inspect';

const cliState: {
  options: CommonOptions;
  command?: CommandName;
} = {
  options: {} as CommonOptions,
};

export const initCliAction = (command: CommandName, options: CommonOptions): void => {
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV =
      command === 'build' || command === 'preview' ? 'production' : 'development';
  }

  // Build multiple environments can be shortened to: --environment name1,name2
  if (options.environment?.some((env) => env.includes(','))) {
    options.environment = options.environment.flatMap((env) => env.split(','));
  }

  cliState.command = command;
  cliState.options = options;
};

const getEnvDir = (cwd: string, envDir?: string) => {
  if (envDir) {
    return path.isAbsolute(envDir) ? envDir : path.join(cwd, envDir);
  }
  return cwd;
};

const loadConfig = async (root: string) => {
  const { options, command } = cliState;
  const {
    content: config,
    filePath,
    dependencies,
  } = await baseLoadConfig({
    cwd: root,
    path: options.config,
    envMode: options.envMode,
    loader: options.configLoader,
    command,
  });

  config.dev ||= {};
  config.source ||= {};
  config.server ||= {};

  if (options.base) {
    config.server.base = options.base;
  }

  if (options.root) {
    config.root = root;
  }

  if (options.mode) {
    config.mode = options.mode;
  }

  if (options.logLevel) {
    config.logLevel = options.logLevel;
  }

  if (options.open && !config.server?.open) {
    config.server.open = options.open;
  }

  if (options.host !== undefined) {
    config.server.host = options.host;
  }

  if (options.port) {
    config.server.port = options.port;
  }

  if (options.strictPort !== undefined) {
    config.server.strictPort = options.strictPort;
  }

  if (options.distPath !== undefined) {
    config.output ||= {};

    const { distPath } = config.output;
    config.output.distPath =
      distPath && typeof distPath === 'object'
        ? { ...distPath, root: options.distPath }
        : { root: options.distPath };
  }

  if (options.sourceMap !== undefined) {
    const sourceMap = options.sourceMap as unknown;

    if (typeof sourceMap !== 'boolean') {
      throw new Error('The "--source-map" option only accepts a boolean value.');
    }

    config.output ||= {};
    config.output.sourceMap = sourceMap;
  }

  // enable CLI shortcuts by default when using Rsbuild CLI
  if (config.dev.cliShortcuts === undefined) {
    config.dev.cliShortcuts = true;
  }

  // watch the config file
  if (filePath) {
    config.dev.watchFiles = [
      ...(config.dev.watchFiles ? castArray(config.dev.watchFiles) : []),
      {
        paths: [filePath, ...dependencies],
        type: 'restart',
      },
    ];
  }

  return config;
};

const restart = async ({ action }: RestartContext): Promise<boolean> => {
  const rsbuild = await init({ isRestart: true });

  // Skip restarting if the config cannot be loaded, for example while the
  // config file contains incomplete edits.
  if (!rsbuild) {
    return false;
  }

  if (action === 'build') {
    await rsbuild.build({ watch: true });
  } else {
    await rsbuild.startDevServer();
  }
  return true;
};

export async function init({ isRestart }: { isRestart?: boolean } = {}): Promise<
  RsbuildInstance | undefined
> {
  let logger = defaultLogger;
  const { options } = cliState;

  try {
    const cwd = process.cwd();
    const root = options.root ? ensureAbsolutePath(cwd, options.root) : cwd;

    const rsbuild = await createRsbuildInternal(
      {
        cwd: root,
        config: () => loadConfig(root),
        environment: options.environment,
        loadEnv:
          options.env === false
            ? false
            : {
                cwd: getEnvDir(root, options.envDir),
                mode: options.envMode,
              },
      },
      { restart },
    );
    logger = rsbuild.logger;

    return rsbuild;
  } catch (err) {
    if (isRestart) {
      logger.error(err);
    } else {
      throw err;
    }
  }
}
