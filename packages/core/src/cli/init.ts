import path from 'node:path';
import { loadConfig, watchFiles } from '../config';
import { castArray, getAbsolutePath } from '../helpers';
import { loadEnv } from '../loadEnv';
import { logger } from '../logger';
import { onBeforeRestartServer } from '../server/restart';
import type { RsbuildInstance } from '../types';
import type { CommonOptions } from './commands';

let commonOpts: CommonOptions = {};

const getEnvDir = (cwd: string, envDir?: string) => {
  if (envDir) {
    return path.isAbsolute(envDir) ? envDir : path.resolve(cwd, envDir);
  }
  return cwd;
};

export async function init({
  cliOptions,
  isRestart,
}: {
  cliOptions?: CommonOptions;
  isRestart?: boolean;
}): Promise<RsbuildInstance | undefined> {
  if (cliOptions) {
    commonOpts = cliOptions;
  }

  try {
    const cwd = process.cwd();
    const root = commonOpts.root ? getAbsolutePath(cwd, commonOpts.root) : cwd;
    const envs = loadEnv({
      cwd: getEnvDir(root, commonOpts.envDir),
      mode: commonOpts.envMode,
    });

    onBeforeRestartServer(envs.cleanup);

    const { content: config, filePath: configFilePath } = await loadConfig({
      cwd: root,
      path: commonOpts.config,
      envMode: commonOpts.envMode,
    });

    const command = process.argv[2];
    if (command === 'dev') {
      const files = [...envs.filePaths];

      if (configFilePath) {
        files.push(configFilePath);
      }

      const { watchFiles: watchFilesConfig } = config.dev || {};
      if (watchFilesConfig?.type === 'reload-server') {
        files.push(...castArray(watchFilesConfig.paths));
        watchFiles(files, watchFilesConfig.options);
      } else {
        watchFiles(files);
      }
    }

    const { createRsbuild } = await import('../createRsbuild');

    config.source ||= {};
    config.source.define = {
      ...envs.publicVars,
      ...config.source.define,
    };

    if (commonOpts.root) {
      config.root = root;
    }

    if (commonOpts.mode) {
      config.mode = commonOpts.mode;
    }

    if (commonOpts.open && !config.server?.open) {
      config.server ||= {};
      config.server.open = commonOpts.open;
    }

    if (commonOpts.host) {
      config.server ||= {};
      config.server.host = commonOpts.host;
    }

    if (commonOpts.port) {
      config.server ||= {};
      config.server.port = commonOpts.port;
    }

    return createRsbuild({
      cwd: root,
      rsbuildConfig: config,
      environment: commonOpts.environment,
    });
  } catch (err) {
    if (isRestart) {
      logger.error(err);
    } else {
      throw err;
    }
  }
}
