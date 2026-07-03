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

export type RsbuildConfigDefinition = RsbuildConfig | RsbuildConfigSyncFn | RsbuildConfigAsyncFn;

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
   * Config file names to search in `cwd` when `path` is not provided.
   * The list replaces the default `rsbuild.config.*` lookup order.
   */
  configFileNames?: string[];
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
  /**
   * The command passed to the config function.
   * @default process.argv[2]
   */
  command?: string;
};

export type LoadConfigResult<Config = RsbuildConfig> = {
  /**
   * The loaded configuration object.
   */
  content: Config;
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
export function defineConfig(config: RsbuildConfigDefinition): RsbuildConfigDefinition;
export function defineConfig(config: RsbuildConfigDefinition) {
  return config;
}

// Resolve the most commonly used config file types first to improve lookup performance.
const DEFAULT_CONFIG_FILE_NAMES = [
  'rsbuild.config.ts',
  'rsbuild.config.js',
  'rsbuild.config.mts',
  'rsbuild.config.mjs',
  'rsbuild.config.cts',
  'rsbuild.config.cjs',
];

const resolveConfigPath = (
  root: string,
  customConfig?: string,
  configFileNames = DEFAULT_CONFIG_FILE_NAMES,
) => {
  if (customConfig) {
    const customConfigPath = isAbsolute(customConfig) ? customConfig : join(root, customConfig);
    if (fs.existsSync(customConfigPath)) {
      return customConfigPath;
    }
    throw new Error(`Cannot find config file: ${color.dim(customConfigPath)}`);
  }

  for (const file of configFileNames) {
    const configFile = join(root, file);

    if (fs.existsSync(configFile)) {
      return configFile;
    }
  }

  return null;
};

export type ConfigLoader = 'auto' | 'jiti' | 'native';

const getConfigExport = (module: unknown): RsbuildConfigDefinition =>
  (module && typeof module === 'object' && 'default' in module
    ? module.default
    : module) as RsbuildConfigDefinition;

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
  configExport: RsbuildConfigDefinition;
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

export async function loadConfig<Config = RsbuildConfig>({
  cwd = process.cwd(),
  path,
  configFileNames,
  envMode,
  meta,
  loader = 'auto',
  command,
}: LoadConfigOptions = {}): Promise<LoadConfigResult<Config>> {
  const configFilePath = resolveConfigPath(cwd, path, configFileNames);

  if (!configFilePath) {
    defaultLogger.debug('no config file found.');
    return {
      content: {} as Config,
      filePath: configFilePath,
      dependencies: [],
    };
  }

  let dependencies: string[] = [];

  const applyMetaInfo = (config: RsbuildConfig) => {
    config._privateMeta = { configFilePath };
    return config as Config;
  };

  let configExport: RsbuildConfigDefinition | undefined;

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

      configExport = await jiti.import<RsbuildConfigDefinition>(configFilePath, {
        default: true,
      });
    } catch (err) {
      defaultLogger.error(`Failed to load file with jiti: ${color.dim(configFilePath)}`);
      throw err;
    }
  }

  if (typeof configExport === 'function') {
    const nodeEnv = getNodeEnv();
    const configParams: ConfigParams = {
      env: nodeEnv,
      command: command ?? process.argv[2],
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
