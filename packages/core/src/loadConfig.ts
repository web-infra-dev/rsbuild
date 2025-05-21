import fs from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { __filename } from './constants';
import { color, getNodeEnv, isObject } from './helpers';
import { logger } from './logger';
import type { RsbuildConfig } from './types';

export type ConfigParams = {
  env: string;
  command: string;
  envMode?: string;
  meta?: Record<string, unknown>;
};

export type RsbuildConfigAsyncFn = (
  env: ConfigParams,
) => Promise<RsbuildConfig>;

export type RsbuildConfigSyncFn = (env: ConfigParams) => RsbuildConfig;

export type RsbuildConfigExport =
  | RsbuildConfig
  | RsbuildConfigSyncFn
  | RsbuildConfigAsyncFn;

export type LoadConfigOptions = {
  /**
   * The root path to resolve the config file.
   * @default process.cwd()
   */
  cwd?: string;
  /**
   * The path to the config file, can be a relative or absolute path.
   * If `path` is not provided, the function will search for the config file in the `cwd`.
   */
  path?: string;
  /**
   * A custom meta object to be passed into the config function of `defineConfig`.
   */
  meta?: Record<string, unknown>;
  /**
   * The `envMode` passed into the config function of `defineConfig`.
   * @default process.env.NODE_ENV
   */
  envMode?: string;
  /**
   * Specify the config loader, can be `jiti` or `native`.
   * - 'jiti': Use `jiti` as loader, which supports TypeScript and ESM out of the box
   * - 'native': Use native Node.js loader, requires TypeScript support in Node.js >= 22.6
   * @default 'jiti'
   */
  loader?: ConfigLoader;
};

export type LoadConfigResult = {
  /**
   * The loaded configuration object.
   */
  content: RsbuildConfig;
  /**
   * The path to the loaded configuration file.
   * Return `null` if the configuration file is not found.
   */
  filePath: string | null;
};

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
    // `.mjs` and `.ts` are the most used configuration types,
    // so we resolve them first for performance
    'rsbuild.config.mjs',
    'rsbuild.config.ts',
    'rsbuild.config.js',
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

export type ConfigLoader = 'jiti' | 'native';

export async function loadConfig({
  cwd = process.cwd(),
  path,
  envMode,
  meta,
  loader = 'jiti',
}: LoadConfigOptions = {}): Promise<LoadConfigResult> {
  const configFilePath = resolveConfigPath(cwd, path);

  if (!configFilePath) {
    logger.debug('no config file found.');
    return {
      content: {},
      filePath: configFilePath,
    };
  }

  const applyMetaInfo = (config: RsbuildConfig) => {
    config._privateMeta = { configFilePath };
    return config;
  };

  let configExport: RsbuildConfigExport;

  if (loader === 'native' || /\.(?:js|mjs|cjs)$/.test(configFilePath)) {
    try {
      const configFileURL = pathToFileURL(configFilePath).href;
      const exportModule = await import(`${configFileURL}?t=${Date.now()}`);
      configExport = exportModule.default ? exportModule.default : exportModule;
    } catch (err) {
      if (loader === 'native') {
        logger.error(
          `Failed to load file with native loader: ${color.dim(configFilePath)}`,
        );
        throw err;
      }
      logger.debug(
        `failed to load file with dynamic import: ${color.dim(configFilePath)}`,
      );
    }
  }

  try {
    if (configExport! === undefined) {
      const { createJiti } = await import('jiti');
      const jiti = createJiti(__filename, {
        // disable require cache to support restart CLI and read the new config
        moduleCache: false,
        interopDefault: true,
        // Always use native `require()` for these packages,
        // This avoids `@rspack/core` being loaded twice.
        nativeModules: ['@rspack/core', 'typescript'],
      });

      configExport = await jiti.import<RsbuildConfigExport>(configFilePath, {
        default: true,
      });
    }
  } catch (err) {
    logger.error(`Failed to load file with jiti: ${color.dim(configFilePath)}`);
    throw err;
  }

  if (typeof configExport === 'function') {
    const command = process.argv[2];
    const nodeEnv = getNodeEnv();
    const configParams: ConfigParams = {
      env: nodeEnv,
      command,
      envMode: envMode || nodeEnv,
      meta,
    };

    const result = await configExport(configParams);

    if (result === undefined) {
      throw new Error(
        '[rsbuild:loadConfig] The config function must return a config object.',
      );
    }

    return {
      content: applyMetaInfo(result),
      filePath: configFilePath,
    };
  }

  if (!isObject(configExport)) {
    throw new Error(
      `[rsbuild:loadConfig] The config must be an object or a function that returns an object, get ${color.yellow(
        configExport,
      )}`,
    );
  }

  logger.debug('loaded config file:', configFilePath);

  return {
    content: applyMetaInfo(configExport),
    filePath: configFilePath,
  };
}
