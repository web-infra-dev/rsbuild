import path from 'node:path';
import { createRsbuild } from '../createRsbuild';
import { castArray, ensureAbsolutePath } from '../helpers';
import { loadConfig as baseLoadConfig } from '../loadConfig';
import { logger } from '../logger';
import { watchFilesForRestart } from '../restart';
import type { RsbuildInstance } from '../types';
import type { CommonOptions } from './commands';

let commonOpts: CommonOptions = {};

const getEnvDir = (cwd: string, envDir?: string) => {
  if (envDir) {
    return path.isAbsolute(envDir) ? envDir : path.join(cwd, envDir);
  }
  return cwd;
};

const loadConfig = async (root: string) => {
  const { content: config, filePath } = await baseLoadConfig({
    cwd: root,
    path: commonOpts.config,
    envMode: commonOpts.envMode,
    loader: commonOpts.configLoader,
  });

  config.dev ||= {};
  config.source ||= {};
  config.server ||= {};

  if (commonOpts.base) {
    config.server.base = commonOpts.base;
  }

  if (commonOpts.root) {
    config.root = root;
  }

  if (commonOpts.mode) {
    config.mode = commonOpts.mode;
  }

  if (commonOpts.logLevel) {
    config.logLevel = commonOpts.logLevel;
  }

  if (commonOpts.open && !config.server?.open) {
    config.server.open = commonOpts.open;
  }

  if (commonOpts.host) {
    config.server.host = commonOpts.host;
  }

  if (commonOpts.port) {
    config.server.port = commonOpts.port;
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
        paths: filePath,
        type: 'reload-server',
      },
    ];
  }

  return config;
};

export async function init({
  cliOptions,
  isRestart,
  isBuildWatch = false,
}: {
  cliOptions?: CommonOptions;
  isRestart?: boolean;
  isBuildWatch?: boolean;
}): Promise<RsbuildInstance | undefined> {
  if (cliOptions) {
    commonOpts = cliOptions;
  }

  // Build multiple environments can be shortened to: --environment name1,name2
  commonOpts.environment = commonOpts.environment?.flatMap((env) =>
    env.split(','),
  );

  try {
    const cwd = process.cwd();
    const root = commonOpts.root
      ? ensureAbsolutePath(cwd, commonOpts.root)
      : cwd;

    const rsbuild = await createRsbuild({
      cwd: root,
      rsbuildConfig: () => loadConfig(root),
      environment: commonOpts.environment,
      loadEnv:
        commonOpts.env === false
          ? false
          : {
              cwd: getEnvDir(root, commonOpts.envDir),
              mode: commonOpts.envMode,
            },
    });

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
