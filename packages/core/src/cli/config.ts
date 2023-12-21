import fs from 'fs';
import { isAbsolute, join } from 'path';
import { color, logger, debounce, type RsbuildConfig } from '@rsbuild/shared';
import { getEnvFiles } from '../loadEnv';
import { restartDevServer } from '../server/restart';

export type ConfigParams = {
  env: string;
  command: string;
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

async function watchConfig(root: string, configFile: string) {
  const chokidar = await import('@rsbuild/shared/chokidar');
  const envFiles = getEnvFiles().map((filename) => join(root, filename));

  const watcher = chokidar.watch([configFile, ...envFiles], {
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
  cwd,
  path,
}: {
  cwd: string;
  path?: string;
}): Promise<RsbuildConfig> {
  const configFile = resolveConfigPath(cwd, path);

  if (!configFile) {
    return {};
  }

  try {
    const { default: jiti } = await import('@rsbuild/shared/jiti');
    const loadConfig = jiti(__filename, {
      esmResolve: true,
      // disable require cache to support restart CLI and read the new config
      requireCache: false,
      interopDefault: true,
    });

    const command = process.argv[2];
    if (command === 'dev') {
      watchConfig(cwd, configFile);
    }

    const configExport = loadConfig(configFile) as RsbuildConfigExport;

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
