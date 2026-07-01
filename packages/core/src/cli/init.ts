import path from 'node:path';
import { createRsbuild } from '../createRsbuild';
import { castArray } from '../helpers';
import { ensureAbsolutePath } from '../helpers/path';
import { loadConfig as baseLoadConfig } from '../loadConfig';
import { defaultLogger } from '../logger';
import { watchFilesForRestart } from '../restart';
import type { RsbuildInstance } from '../types';
import type { CommonOptions } from './commands';

let cliOptions: CommonOptions = {};
let argv: string[] | undefined;

const getEnvDir = (cwd: string, envDir?: string) => {
  if (envDir) {
    return path.isAbsolute(envDir) ? envDir : path.join(cwd, envDir);
  }
  return cwd;
};

const loadConfig = async (root: string) => {
  const {
    content: config,
    filePath,
    dependencies,
  } = await baseLoadConfig({
    cwd: root,
    path: cliOptions.config,
    envMode: cliOptions.envMode,
    loader: cliOptions.configLoader,
    command: argv?.[2],
  });

  config.dev ||= {};
  config.source ||= {};
  config.server ||= {};

  if (cliOptions.base) {
    config.server.base = cliOptions.base;
  }

  if (cliOptions.root) {
    config.root = root;
  }

  if (cliOptions.mode) {
    config.mode = cliOptions.mode;
  }

  if (cliOptions.logLevel) {
    config.logLevel = cliOptions.logLevel;
  }

  if (cliOptions.open && !config.server?.open) {
    config.server.open = cliOptions.open;
  }

  if (cliOptions.host !== undefined) {
    config.server.host = cliOptions.host;
  }

  if (cliOptions.port) {
    config.server.port = cliOptions.port;
  }

  if (cliOptions.strictPort !== undefined) {
    config.server.strictPort = cliOptions.strictPort;
  }

  if (cliOptions.distPath !== undefined) {
    config.output ||= {};

    const { distPath } = config.output;
    config.output.distPath =
      distPath && typeof distPath === 'object'
        ? { ...distPath, root: cliOptions.distPath }
        : { root: cliOptions.distPath };
  }

  if (cliOptions.sourceMap !== undefined) {
    const sourceMap = cliOptions.sourceMap as unknown;

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
        type: 'reload-server',
      },
    ];
  }

  return config;
};

export async function init({
  cliOptions: currentCliOptions,
  isRestart,
  isBuildWatch = false,
  argv: currentArgv,
}: {
  cliOptions?: CommonOptions;
  isRestart?: boolean;
  isBuildWatch?: boolean;
  argv?: string[];
}): Promise<RsbuildInstance | undefined> {
  if (currentCliOptions) {
    cliOptions = currentCliOptions;
  }

  if (currentArgv) {
    argv = currentArgv;
  }

  // Build multiple environments can be shortened to: --environment name1,name2
  if (cliOptions.environment?.some((env) => env.includes(','))) {
    cliOptions.environment = cliOptions.environment.flatMap((env) => env.split(','));
  }

  let logger = defaultLogger;

  try {
    const cwd = process.cwd();
    const root = cliOptions.root ? ensureAbsolutePath(cwd, cliOptions.root) : cwd;

    const rsbuild = await createRsbuild({
      cwd: root,
      config: () => loadConfig(root),
      environment: cliOptions.environment,
      loadEnv:
        cliOptions.env === false
          ? false
          : {
              cwd: getEnvDir(root, cliOptions.envDir),
              mode: cliOptions.envMode,
            },
    });
    logger = rsbuild.logger;

    rsbuild.onBeforeCreateCompiler(() => {
      // Skip watching files when not in dev mode or not in build watch mode
      if (rsbuild.context.action !== 'dev' && !isBuildWatch) {
        return;
      }

      const files: string[] = [];
      const config = rsbuild.getNormalizedConfig();

      if (config.dev.watchFiles) {
        for (const watchConfig of config.dev.watchFiles) {
          if (watchConfig.type !== 'reload-server') {
            continue;
          }

          const paths = castArray(watchConfig.paths);
          if (watchConfig.options) {
            watchFilesForRestart({
              files: paths,
              rsbuild,
              isBuildWatch,
              watchOptions: watchConfig.options,
            });
          } else {
            files.push(...paths);
          }
        }
      }

      watchFilesForRestart({
        files,
        rsbuild,
        isBuildWatch,
      });
    });

    return rsbuild;
  } catch (err) {
    if (isRestart) {
      logger.error(err);
    } else {
      throw err;
    }
  }
}
