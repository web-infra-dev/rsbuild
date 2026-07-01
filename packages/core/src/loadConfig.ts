import fs from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { color, getNodeEnv, isObject } from './helpers';
import { defaultLogger } from './logger';
import type { RsbuildConfig } from './types';

export type ConfigParams = {
  env: string;
  command: string;
  envMode?: string;
  meta?: Record<string, unknown>;
};

export type RsbuildConfigAsyncFn = (env: ConfigParams) => Promise<RsbuildConfig>;

export type RsbuildConfigSyncFn = (env: ConfigParams) => RsbuildConfig;

export type RsbuildConfigExport = RsbuildConfig | RsbuildConfigSyncFn | RsbuildConfigAsyncFn;

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
   * Specify the config loader, can be `auto`, `jiti` or `native`.
   * - 'auto': Use native Node.js loader first, fallback to jiti if failed
   * - 'jiti': Use `jiti` as loader, which supports TypeScript and ESM out of the box
   * - 'native': Use native Node.js loader, requires TypeScript support in Node.js >= 22.6
   * @default 'auto'
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
  /**
   * Absolute file paths of statically imported (relative) dependencies of the
   * config file.
   */
  dependencies: string[];
};

/**
 * This function helps you to autocomplete configuration types.
 * It accepts a Rsbuild config object, or a function that returns a config.
 */
export function defineConfig(config: RsbuildConfig): RsbuildConfig;
export function defineConfig(config: RsbuildConfigSyncFn): RsbuildConfigSyncFn;
export function defineConfig(config: RsbuildConfigAsyncFn): RsbuildConfigAsyncFn;
export function defineConfig(config: RsbuildConfigExport): RsbuildConfigExport;
export function defineConfig(config: RsbuildConfigExport) {
  return config;
}

const resolveConfigPath = (root: string, customConfig?: string) => {
  if (customConfig) {
    const customConfigPath = isAbsolute(customConfig) ? customConfig : join(root, customConfig);
    if (fs.existsSync(customConfigPath)) {
      return customConfigPath;
    }
    throw new Error(`Cannot find config file: ${color.dim(customConfigPath)}`);
  }

  // Resolve the most commonly used config file types first
  // to improve lookup performance.
  const CONFIG_FILES = [
    'rsbuild.config.ts',
    'rsbuild.config.js',
    'rsbuild.config.mts',
    'rsbuild.config.mjs',
    'rsbuild.config.cts',
    'rsbuild.config.cjs',
  ];

  for (const file of CONFIG_FILES) {
    const configFile = join(root, file);

    if (fs.existsSync(configFile)) {
      return configFile;
    }
  }

  return null;
};

export type ConfigLoader = 'auto' | 'jiti' | 'native';

const getConfigExport = (module: unknown): RsbuildConfigExport =>
  (module && typeof module === 'object' && 'default' in module
    ? module.default
    : module) as RsbuildConfigExport;

const tryFreshImport = async (configFileURL: string) => {
  try {
    const { freshImport } = await import('fresh-import');
    return await freshImport(configFileURL);
  } catch (err) {
    defaultLogger.debug('failed to initialize fresh-import, fallback to dynamic import.');
    defaultLogger.debug(err);
  }
};

const loadConfigWithNative = async (
  configFilePath: string,
): Promise<{
  configExport: RsbuildConfigExport;
  dependencies: string[];
}> => {
  const configFileURL = pathToFileURL(configFilePath).href;
  const freshImportResult = await tryFreshImport(configFileURL);

  if (freshImportResult) {
    return {
      configExport: getConfigExport(freshImportResult.result),
      dependencies: freshImportResult.dependencies.sort(),
    };
  }

  const exportModule = await import(`${configFileURL}?t=${Date.now()}`);
  return {
    configExport: getConfigExport(exportModule),
    dependencies: [],
  };
};

export async function loadConfig({
  cwd = process.cwd(),
  path,
  envMode,
  meta,
  loader = 'auto',
}: LoadConfigOptions = {}): Promise<LoadConfigResult> {
  const configFilePath = resolveConfigPath(cwd, path);

  if (!configFilePath) {
    defaultLogger.debug('no config file found.');
    return {
      content: {},
      filePath: configFilePath,
      dependencies: [],
    };
  }

  let dependencies: string[] = [];

  const applyMetaInfo = (config: RsbuildConfig) => {
    config._privateMeta = { configFilePath };
    return config;
  };

  let configExport: RsbuildConfigExport | undefined;

  // Determine the loading strategy based on the config loader type
  const useNative = Boolean(
    loader === 'native' ||
    (loader === 'auto' &&
      (process.features.typescript || process.versions.bun || process.versions.deno)),
  );

  if (useNative || /\.(?:js|mjs|cjs)$/.test(configFilePath)) {
    try {
      ({ configExport, dependencies } = await loadConfigWithNative(configFilePath));
    } catch (err) {
      const errorMessage = `Failed to load file with native loader: ${color.dim(configFilePath)}`;
      if (loader === 'native') {
        defaultLogger.error(errorMessage);
        throw err;
      }

      defaultLogger.debug(`${errorMessage}, fallback to jiti.`);
      defaultLogger.debug(err);
    }
  }

  if (configExport === undefined) {
    try {
      const { createJiti } = await import('jiti');
      const jiti = createJiti(import.meta.filename, {
        // disable require cache to support restart CLI and read the new config
        moduleCache: false,
        interopDefault: true,
        // Always use native `require()` for these packages,
        // This avoids `@rspack/core` being loaded twice.
        nativeModules: ['typescript'],
      });

      configExport = await jiti.import<RsbuildConfigExport>(configFilePath, {
        default: true,
      });
    } catch (err) {
      defaultLogger.error(`Failed to load file with jiti: ${color.dim(configFilePath)}`);
      throw err;
    }
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
        `${color.dim('[rsbuild:loadConfig]')} The config function must return a config object.`,
      );
    }

    return {
      content: applyMetaInfo(result),
      filePath: configFilePath,
      dependencies,
    };
  }

  if (!isObject(configExport)) {
    throw new Error(
      `${color.dim('[rsbuild:loadConfig]')} The config must be an object or a function that returns an object, get ${color.yellow(
        configExport,
      )}`,
    );
  }

  defaultLogger.debug('configuration loaded from:', configFilePath);

  return {
    content: applyMetaInfo(configExport),
    filePath: configFilePath,
    dependencies,
  };
}
