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
import { restartDevServer } from '../server/restart';

export type ConfigParams = {
  env: string;
  command: string;
  mode?: string;
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

export async function loadConfigByPath(configFile: string, mode?: string) {
  try {
    const { default: jiti } = await import('@rsbuild/shared/jiti');
    const loadConfig = jiti(__filename, {
      esmResolve: true,
      // disable require cache to support restart CLI and read the new config
      requireCache: false,
      interopDefault: true,
    });

    const configExport = loadConfig(configFile) as RsbuildConfigExport;

    if (typeof configExport === 'function') {
      const command = process.argv[2];
      const params: ConfigParams = {
        env: getNodeEnv(),
        command,
        mode,
      };

      const result = await configExport(params);

      if (result === undefined) {
        throw new Error('Rsbuild config function must return a config object.');
      }

      return result;
    }

    if (!isObject(configExport)) {
      throw new Error(
        `Rsbuild config must be an object or a function that returns an object, get ${color.yellow(
          configExport,
        )}`,
      );
    }

    return configExport;
  } catch (err) {
    logger.error(`Failed to load file: ${color.dim(configFile)}`);
    throw err;
  }
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

  return loadConfigByPath(configFile);
}

// TODO replace loadConfig in v0.4.0
export async function loadConfigV2({
  cwd,
  path,
  mode,
}: {
  cwd: string;
  path?: string;
  mode?: string;
}): Promise<{ content: RsbuildConfig; filePath: string | null }> {
  const configFile = resolveConfigPath(cwd, path);

  if (!configFile) {
    return {
      content: {},
      filePath: configFile,
    };
  }

  return {
    content: await loadConfigByPath(configFile, mode),
    filePath: configFile,
  };
}
