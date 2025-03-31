import fs from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import RspackChain from '../compiled/rspack-chain/index.js';
import {
  ASSETS_DIST_DIR,
  CSS_DIST_DIR,
  DEFAULT_ASSET_PREFIX,
  DEFAULT_DATA_URL_SIZE,
  DEFAULT_DEV_HOST,
  DEFAULT_MOUNT_ID,
  DEFAULT_PORT,
  FONT_DIST_DIR,
  HMR_SOCKET_PATH,
  HTML_DIST_DIR,
  IMAGE_DIST_DIR,
  MEDIA_DIST_DIR,
  ROOT_DIST_DIR,
  SVG_DIST_DIR,
  TS_CONFIG_FILE,
  WASM_DIST_DIR,
  __filename,
} from './constants';
import {
  color,
  findExists,
  getNodeEnv,
  isFileExists,
  isObject,
  upperFirst,
} from './helpers';
import { logger } from './logger';
import { mergeRsbuildConfig } from './mergeConfig';
import type {
  InspectConfigOptions,
  InspectConfigResult,
  NormalizedConfig,
  NormalizedDevConfig,
  NormalizedEnvironmentConfig,
  NormalizedHtmlConfig,
  NormalizedOutputConfig,
  NormalizedPerformanceConfig,
  NormalizedResolveConfig,
  NormalizedSecurityConfig,
  NormalizedServerConfig,
  NormalizedSourceConfig,
  NormalizedToolsConfig,
  PluginManager,
  PublicDir,
  PublicDirOptions,
  RsbuildConfig,
  RsbuildEntry,
  RsbuildMode,
  RsbuildPlugin,
} from './types';

const require = createRequire(import.meta.url);

const getDefaultDevConfig = (): NormalizedDevConfig => ({
  hmr: true,
  liveReload: true,
  // Temporary placeholder, default: `${server.base}`
  assetPrefix: DEFAULT_ASSET_PREFIX,
  writeToDisk: false,
  cliShortcuts: false,
  client: {
    path: HMR_SOCKET_PATH,
    port: '',
    host: '',
    overlay: true,
    reconnect: 100,
  },
});

/**
 * Default allowed origins for CORS.
 * - localhost
 * - 127.0.0.1
 * - [::1]
 */
export const LOCAL_ORIGINS_REGEX: RegExp =
  /^https?:\/\/(?:(?:[^:]+\.)?localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/;

const getDefaultServerConfig = (): NormalizedServerConfig => ({
  port: DEFAULT_PORT,
  host: DEFAULT_DEV_HOST,
  open: false,
  base: '/',
  htmlFallback: 'index',
  compress: true,
  printUrls: true,
  strictPort: false,
  cors: {
    origin: LOCAL_ORIGINS_REGEX,
  },
  middlewareMode: false,
});

let swcHelpersPath: string;

const getDefaultSourceConfig = (): NormalizedSourceConfig => {
  return {
    alias: {},
    define: {},
    preEntry: [],
    decorators: {
      version: '2022-03',
    },
  };
};

const getDefaultHtmlConfig = (): NormalizedHtmlConfig => ({
  meta: {
    charset: { charset: 'UTF-8' },
    viewport: 'width=device-width, initial-scale=1.0',
  },
  title: 'Rsbuild App',
  inject: 'head',
  mountId: DEFAULT_MOUNT_ID,
  crossorigin: false,
  outputStructure: 'flat',
  scriptLoading: 'defer',
});

const getDefaultSecurityConfig = (): NormalizedSecurityConfig => ({
  nonce: '',
  sri: {
    enable: false,
  },
});

const getDefaultToolsConfig = (): NormalizedToolsConfig => ({
  cssExtract: {
    loaderOptions: {},
    pluginOptions: {
      ignoreOrder: true,
    },
  },
});

const getDefaultPerformanceConfig = (): NormalizedPerformanceConfig => ({
  profile: false,
  printFileSize: true,
  removeConsole: false,
  removeMomentLocale: false,
  chunkSplit: {
    strategy: 'split-by-experience',
  },
});

const getDefaultOutputConfig = (): NormalizedOutputConfig => ({
  target: 'web',
  cleanDistPath: 'auto',
  distPath: {
    root: ROOT_DIST_DIR,
    css: CSS_DIST_DIR,
    svg: SVG_DIST_DIR,
    font: FONT_DIST_DIR,
    html: HTML_DIST_DIR,
    wasm: WASM_DIST_DIR,
    image: IMAGE_DIST_DIR,
    media: MEDIA_DIST_DIR,
    assets: ASSETS_DIST_DIR,
  },
  // Temporary placeholder, default: `${server.base}`
  assetPrefix: DEFAULT_ASSET_PREFIX,
  filename: {},
  charset: 'utf8',
  polyfill: 'off',
  dataUriLimit: {
    svg: DEFAULT_DATA_URL_SIZE,
    font: DEFAULT_DATA_URL_SIZE,
    image: DEFAULT_DATA_URL_SIZE,
    media: DEFAULT_DATA_URL_SIZE,
    assets: DEFAULT_DATA_URL_SIZE,
  },
  legalComments: 'linked',
  injectStyles: false,
  minify: true,
  manifest: false,
  sourceMap: {
    js: undefined,
    css: false,
  },
  filenameHash: true,
  inlineScripts: false,
  inlineStyles: false,
  cssModules: {
    auto: true,
    namedExport: false,
    exportGlobals: false,
    exportLocalsConvention: 'camelCase',
  },
  emitAssets: true,
});

const getDefaultResolveConfig = (): NormalizedResolveConfig => {
  if (!swcHelpersPath) {
    swcHelpersPath = dirname(require.resolve('@swc/helpers/package.json'));
  }

  return {
    alias: {
      '@swc/helpers': swcHelpersPath,
    },
    aliasStrategy: 'prefer-tsconfig',
    extensions: [
      // most projects are using TypeScript, resolve .ts(x) files first to reduce resolve time.
      '.ts',
      '.tsx',
      '.mjs',
      '.js',
      '.jsx',
      '.json',
    ],
  };
};

const createDefaultConfig = (): RsbuildConfig => ({
  dev: getDefaultDevConfig(),
  server: getDefaultServerConfig(),
  html: getDefaultHtmlConfig(),
  resolve: getDefaultResolveConfig(),
  source: getDefaultSourceConfig(),
  output: getDefaultOutputConfig(),
  tools: getDefaultToolsConfig(),
  security: getDefaultSecurityConfig(),
  performance: getDefaultPerformanceConfig(),
  environments: {},
});

export function getDefaultEntry(root: string): RsbuildEntry {
  const files = [
    // Most projects are using typescript now.
    // So we put `.ts` as the first one to improve performance.
    'ts',
    'js',
    'tsx',
    'jsx',
    'mts',
    'cts',
    'mjs',
    'cjs',
  ].map((ext) => join(root, `src/index.${ext}`));

  const entryFile = findExists(files);

  if (entryFile) {
    return {
      index: entryFile,
    };
  }

  return {};
}

export const withDefaultConfig = async (
  rootPath: string,
  config: RsbuildConfig,
): Promise<RsbuildConfig> => {
  const merged = mergeRsbuildConfig(createDefaultConfig(), config);

  merged.root ||= rootPath;
  merged.source ||= {};

  if (merged.server?.base) {
    if (config.dev?.assetPrefix === undefined) {
      merged.dev ||= {};
      merged.dev.assetPrefix = merged.server.base;
    }

    if (config.output?.assetPrefix === undefined) {
      merged.output ||= {};
      merged.output.assetPrefix = merged.server.base;
    }
  }

  if (!merged.source.tsconfigPath) {
    const tsconfigPath = join(rootPath, TS_CONFIG_FILE);

    if (await isFileExists(tsconfigPath)) {
      merged.source.tsconfigPath = tsconfigPath;
    }
  }

  return merged;
};

/** #__PURE__
 * 1. May used by multiple plugins.
 * 2. Object value that should not be empty.
 * 3. Meaningful and can be filled by constant value.
 */
export const normalizeConfig = (config: RsbuildConfig): NormalizedConfig => {
  const getMode = (): RsbuildMode => {
    if (config.mode) {
      return config.mode;
    }
    const nodeEnv = getNodeEnv();
    return nodeEnv === 'production' || nodeEnv === 'development'
      ? nodeEnv
      : 'none';
  };

  return mergeRsbuildConfig(
    {
      ...createDefaultConfig(),
      mode: getMode(),
    },
    config,
  ) as unknown as NormalizedConfig;
};

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

const normalizePluginObject = (plugin: RsbuildPlugin): RsbuildPlugin => {
  const { setup: _, ...rest } = plugin;
  return {
    ...rest,
    // use empty `setup` function as it's not meaningful in inspect config
    setup() {},
  };
};

export const getRsbuildInspectConfig = ({
  normalizedConfig,
  inspectOptions,
  pluginManager,
}: {
  normalizedConfig: NormalizedConfig;
  inspectOptions: InspectConfigOptions;
  pluginManager: PluginManager;
}): {
  rawRsbuildConfig: string;
  rsbuildConfig: InspectConfigResult['origin']['rsbuildConfig'];
  rawEnvironmentConfigs: Array<{
    name: string;
    content: string;
  }>;
  environmentConfigs: InspectConfigResult['origin']['environmentConfigs'];
} => {
  const { environments, ...rsbuildConfig } = normalizedConfig;

  const debugConfig: Omit<NormalizedConfig, 'environments'> = {
    ...rsbuildConfig,
    plugins: pluginManager.getPlugins().map(normalizePluginObject),
  };

  const rawRsbuildConfig = stringifyConfig(debugConfig, inspectOptions.verbose);
  const environmentConfigs: Record<string, NormalizedEnvironmentConfig> = {};

  const rawEnvironmentConfigs: Array<{
    name: string;
    content: string;
  }> = [];

  for (const [name, config] of Object.entries(environments)) {
    const debugConfig = {
      ...config,
      plugins: pluginManager
        .getPlugins({ environment: name })
        .map(normalizePluginObject),
    };
    rawEnvironmentConfigs.push({
      name,
      content: stringifyConfig(debugConfig, inspectOptions.verbose),
    });
    environmentConfigs[name] = debugConfig;
  }

  return {
    rsbuildConfig,
    rawRsbuildConfig,
    environmentConfigs: environments,
    rawEnvironmentConfigs,
  };
};

export async function outputInspectConfigFiles({
  rawBundlerConfigs,
  rawEnvironmentConfigs,
  inspectOptions,
  configType,
}: {
  configType: string;
  rawEnvironmentConfigs: Array<{
    name: string;
    content: string;
  }>;
  rawBundlerConfigs: Array<{
    name: string;
    content: string;
  }>;
  inspectOptions: InspectConfigOptions & {
    outputPath: string;
  };
}): Promise<void> {
  const { outputPath } = inspectOptions;

  const files = [
    ...rawEnvironmentConfigs.map(({ name, content }) => {
      if (rawEnvironmentConfigs.length === 1) {
        const outputFile = 'rsbuild.config.mjs';
        const outputFilePath = join(outputPath, outputFile);

        return {
          path: outputFilePath,
          label: 'Rsbuild config',
          content,
        };
      }
      const outputFile = `rsbuild.config.${name}.mjs`;
      const outputFilePath = join(outputPath, outputFile);

      return {
        path: outputFilePath,
        label: `Rsbuild config (${name})`,
        content,
      };
    }),
    ...rawBundlerConfigs.map(({ name, content }) => {
      const outputFile = `${configType}.config.${name}.mjs`;
      let outputFilePath = join(outputPath, outputFile);

      // if filename is conflict, add a random id to the filename.
      if (fs.existsSync(outputFilePath)) {
        outputFilePath = outputFilePath.replace(/\.mjs$/, `.${Date.now()}.mjs`);
      }

      return {
        path: outputFilePath,
        label: `${upperFirst(configType)} Config (${name})`,
        content,
      };
    }),
  ];

  await fs.promises.mkdir(outputPath, { recursive: true });

  await Promise.all(
    files.map(async (item) => {
      return fs.promises.writeFile(item.path, `export default ${item.content}`);
    }),
  );

  const fileInfos = files
    .map(
      (item) =>
        `  - ${color.bold(color.yellow(item.label))}: ${color.underline(
          item.path,
        )}`,
    )
    .join('\n');

  logger.success(
    `config inspection completed, generated files: \n\n${fileInfos}\n`,
  );
}

export function stringifyConfig(config: unknown, verbose?: boolean): string {
  // webpackChain.toString can be used as a common stringify method
  const stringify = RspackChain.toString as (
    config: unknown,
    options: { verbose?: boolean },
  ) => string;

  return stringify(config, { verbose });
}

export const normalizePublicDirs = (
  publicDir?: PublicDir,
): Required<PublicDirOptions>[] => {
  if (publicDir === false) {
    return [];
  }

  const defaultConfig: Required<PublicDirOptions> = {
    name: 'public',
    copyOnBuild: 'auto',
    watch: false,
  };

  // enable public dir by default
  if (publicDir === undefined) {
    return [defaultConfig];
  }

  if (Array.isArray(publicDir)) {
    return publicDir.map((options) => ({
      ...defaultConfig,
      ...options,
    }));
  }

  return [
    {
      ...defaultConfig,
      ...publicDir,
    },
  ];
};
