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

export const defineConfig = (config: RsbuildConfig) => config;

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
): Promise<ReturnType<typeof defineConfig>> {
  const configFile = resolveConfigPath(customConfig);

  if (configFile) {
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

    return loadConfig(configFile);
  }

  return {};
}
