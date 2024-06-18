import { isDev } from '@rsbuild/shared';
import { loadConfig, watchFiles } from '../config';
import { loadEnv } from '../loadEnv';
import { logger } from '../logger';
import { onBeforeRestartServer } from '../server/restart';
import type { CommonOptions } from './commands';

let commonOpts: CommonOptions = {};

export async function init({
  cliOptions,
  isRestart,
}: {
  cliOptions?: CommonOptions;
  isRestart?: boolean;
}) {
  if (cliOptions) {
    commonOpts = cliOptions;
  }

  try {
    const root = process.cwd();
    const envs = loadEnv({
      cwd: root,
      mode: cliOptions?.envMode,
    });

    if (isDev()) {
      onBeforeRestartServer(envs.cleanup);
    }

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

      watchFiles(files);
    }

    const { createRsbuild } = await import('../createRsbuild');

    config.source ||= {};
    config.source.define = {
      ...envs.publicVars,
      ...config.source.define,
    };

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
    });
  } catch (err) {
    if (isRestart) {
      logger.error(err);
    } else {
      throw err;
    }
  }
}
