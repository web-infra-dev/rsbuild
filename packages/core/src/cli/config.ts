import fs from 'fs';
import { isAbsolute, join } from 'path';
import {
  color,
  logger,
  debounce,
  type RsbuildConfig as BaseRsbuildConfig,
} from '@rsbuild/shared';
import { restartDevServer } from '../server/restart';

export type RsbuildConfig = BaseRsbuildConfig & {
  /**
   * @private only for testing
   */
  provider?: any;
};

export type ConfigParams = {
  env: string;
  command: string;
};

export type UserConfigExport =
  | RsbuildConfig
  | ((env: ConfigParams) => RsbuildConfig | Promise<RsbuildConfig>);

/**
 * This function helps you to autocomplete configuration types.
 * It accepts a Rsbuild config object, or a function that returns a config.
 */
export const defineConfig = (config: UserConfigExport) => config;

const resolveConfigPath = (customConfig?: string) => {
  const root = process.cwd();

  if (customConfig) {
    const customConfigPath = isAbsolute(customConfig)
      ? customConfig
      : join(root, customConfig);
    if (fs.existsSync(customConfigPath)) {
      return customConfigPath;
    }
    logger.warn(`Cannot find config file: ${color.dim(customConfigPath)}\n`);
  }

  const CONFIG_FILES = [
    'rsbuild.config.ts',
    'rsbuild.config.js',
    'rsbuild.config.mjs',
    'rsbuild.config.cjs',
    'rsbuild.config.mts',
    'rsbuild.config.cts',
  ];

  for (const file of CONFIG_FILES) {
    const configFile = join(root, file);

    if (fs.existsSync(configFile)) {
      return configFile;
    }
  }

  return null;
};

async function watchConfig(configFile: string) {
  const chokidar = await import('@rsbuild/shared/chokidar');

  const watcher = chokidar.watch(configFile, {
    // If watching fails due to read permissions, the errors will be suppressed silently.
    ignorePermissionErrors: true,
  });

  const callback = debounce(
    async () => {
      watcher.close();
      await restartDevServer({ filePath: configFile });
    },
    // set 300ms debounce to avoid restart frequently
    300,
  );

  watcher.on('change', callback);
  watcher.on('unlink', callback);
}

export async function loadConfig(
  customConfig?: string,
): Promise<RsbuildConfig> {
  const configFile = resolveConfigPath(customConfig);

  if (!configFile) {
    return {};
  }

  try {
    const { default: jiti } = await import('../../compiled/jiti');
    const loadConfig = jiti(__filename, {
      esmResolve: true,
      // disable require cache to support restart CLI and read the new config
      requireCache: false,
      interopDefault: true,
    });

    const command = process.argv[2];
    if (command === 'dev') {
      watchConfig(configFile);
    }

    const configExport = loadConfig(configFile) as UserConfigExport;

    if (typeof configExport === 'function') {
      const params: ConfigParams = {
        env: process.env.NODE_ENV!,
        command,
      };

      return (await configExport(params)) || {};
    }

    return configExport;
  } catch (err) {
    logger.error(`Failed to load file: ${color.dim(configFile)}`);
    throw err;
  }
}
