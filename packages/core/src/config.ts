import fs from 'node:fs';
import { isAbsolute, join } from 'node:path';
import {
  color,
  logger,
  isObject,
  debounce,
  getNodeEnv,
  type RsbuildConfig,
} from '@rsbuild/shared';
import { restartDevServer } from './server/restart';

export type ConfigParams = {
  env: string;
  command: string;
  envMode?: string;
};

export type RsbuildConfigAsyncFn = (
  env: ConfigParams,
) => Promise<RsbuildConfig>;

export type RsbuildConfigSyncFn = (env: ConfigParams) => RsbuildConfig;

export type RsbuildConfigExport =
  | RsbuildConfig
  | RsbuildConfigSyncFn
  | RsbuildConfigAsyncFn;

/**
 * This function helps you to autocomplete configuration types.
 * It accepts a Rsbuild config object, or a function that returns a config.
 */
export function defineConfig(config: RsbuildConfig): RsbuildConfig;
export function defineConfig(config: RsbuildConfigSyncFn): RsbuildConfigSyncFn;
export function defineConfig(
  config: RsbuildConfigAsyncFn,
): RsbuildConfigAsyncFn;
export function defineConfig(config: RsbuildConfigExport): RsbuildConfigExport;
export function defineConfig(config: RsbuildConfigExport) {
  return config;
}

const resolveConfigPath = (root: string, customConfig?: string) => {
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

export async function watchFiles(files: string[]) {
  if (!files.length) {
    return;
  }

  const chokidar = await import('@rsbuild/shared/chokidar');
  const watcher = chokidar.watch(files, {
    // do not trigger add for initial files
    ignoreInitial: true,
    // If watching fails due to read permissions, the errors will be suppressed silently.
    ignorePermissionErrors: true,
  });

  const callback = debounce(
    async (filePath) => {
      watcher.close();
      await restartDevServer({ filePath });
    },
    // set 300ms debounce to avoid restart frequently
    300,
  );

  watcher.on('add', callback);
  watcher.on('change', callback);
  watcher.on('unlink', callback);
}

export async function loadConfig({
  cwd = process.cwd(),
  path,
  envMode,
}: {
  cwd?: string;
  path?: string;
  envMode?: string;
}): Promise<{ content: RsbuildConfig; filePath: string | null }> {
  const configFilePath = resolveConfigPath(cwd, path);

  if (!configFilePath) {
    return {
      content: {},
      filePath: configFilePath,
    };
  }

  const applyMetaInfo = (config: RsbuildConfig) => {
    config._privateMeta = { configFilePath };
    return config;
  };

  try {
    const { default: jiti } = await import('@rsbuild/shared/jiti');
    const loadConfig = jiti(__filename, {
      esmResolve: true,
      // disable require cache to support restart CLI and read the new config
      requireCache: false,
      interopDefault: true,
    });

    const configExport = loadConfig(configFilePath) as RsbuildConfigExport;

    if (typeof configExport === 'function') {
      const command = process.argv[2];
      const params: ConfigParams = {
        env: getNodeEnv(),
        command,
        envMode: envMode || getNodeEnv(),
      };

      const result = await configExport(params);

      if (result === undefined) {
        throw new Error('Rsbuild config function must return a config object.');
      }

      return {
        content: applyMetaInfo(result),
        filePath: configFilePath,
      };
    }

    if (!isObject(configExport)) {
      throw new Error(
        `Rsbuild config must be an object or a function that returns an object, get ${color.yellow(
          configExport,
        )}`,
      );
    }

    return {
      content: applyMetaInfo(configExport),
      filePath: configFilePath,
    };
  } catch (err) {
    logger.error(`Failed to load file: ${color.dim(configFilePath)}`);
    throw err;
  }
}
