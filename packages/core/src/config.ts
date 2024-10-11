import fs from 'node:fs';
import { isAbsolute, join } from 'node:path';
import type { WatchOptions } from 'chokidar';
import color from 'picocolors';
import RspackChain from 'rspack-chain';
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
} from './constants';
import {
  debounce,
  findExists,
  getNodeEnv,
  isFileExists,
  isObject,
  upperFirst,
} from './helpers';
import { logger } from './logger';
import { mergeRsbuildConfig } from './mergeConfig';
import { restartDevServer } from './server/restart';
import type {
  InspectConfigOptions,
  InspectConfigResult,
  NormalizedConfig,
  NormalizedDevConfig,
  NormalizedEnvironmentConfig,
  NormalizedHtmlConfig,
  NormalizedOutputConfig,
  NormalizedPerformanceConfig,
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
} from './types';

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

const getDefaultServerConfig = (): NormalizedServerConfig => ({
  port: DEFAULT_PORT,
  host: DEFAULT_DEV_HOST,
  open: false,
  base: '/',
  htmlFallback: 'index',
  compress: true,
  printUrls: true,
  strictPort: false,
});

const getDefaultSourceConfig = (): NormalizedSourceConfig => ({
  alias: {},
  define: {},
  aliasStrategy: 'prefer-tsconfig',
  preEntry: [],
  decorators: {
    version: '2022-03',
  },
});

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
  buildCache: true,
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

const createDefaultConfig = (): RsbuildConfig => ({
  dev: getDefaultDevConfig(),
  server: getDefaultServerConfig(),
  html: getDefaultHtmlConfig(),
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

export async function watchFilesForRestart(
  files: string[],
  watchOptions?: WatchOptions,
): Promise<void> {
  if (!files.length) {
    return;
  }

  const chokidar = await import('chokidar');
  const watcher = chokidar.watch(files, {
    // do not trigger add for initial files
    ignoreInitial: true,
    // If watching fails due to read permissions, the errors will be suppressed silently.
    ignorePermissionErrors: true,
    ...watchOptions,
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
} = {}): Promise<{ content: RsbuildConfig; filePath: string | null }> {
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

  let configExport: RsbuildConfigExport;

  if (/\.(?:js|mjs|cjs)$/.test(configFilePath)) {
    try {
      const exportModule = await import(`${configFilePath}?t=${Date.now()}`);
      configExport = exportModule.default ? exportModule.default : exportModule;
    } catch (err) {
      logger.debug(
        `Failed to load file with dynamic import: ${color.dim(configFilePath)}`,
      );
    }
  }

  try {
    if (configExport! === undefined) {
      const { default: jiti } = await import('jiti');
      const loadConfig = jiti(__filename, {
        esmResolve: true,
        // disable require cache to support restart CLI and read the new config
        requireCache: false,
        interopDefault: true,
      });

      configExport = loadConfig(configFilePath) as RsbuildConfigExport;
    }
  } catch (err) {
    logger.error(`Failed to load file with jiti: ${color.dim(configFilePath)}`);
    throw err;
  }

  if (typeof configExport === 'function') {
    const command = process.argv[2];
    const nodeEnv = getNodeEnv();
    const params: ConfigParams = {
      env: nodeEnv,
      command,
      envMode: envMode || nodeEnv,
    };

    const result = await configExport(params);

    if (result === undefined) {
      throw new Error('The config function must return a config object.');
    }

    return {
      content: applyMetaInfo(result),
      filePath: configFilePath,
    };
  }

  if (!isObject(configExport)) {
    throw new Error(
      `The config must be an object or a function that returns an object, get ${color.yellow(
        configExport,
      )}`,
    );
  }

  return {
    content: applyMetaInfo(configExport),
    filePath: configFilePath,
  };
}

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

  const pluginNames = pluginManager.getPlugins().map((p) => p.name);

  const rsbuildDebugConfig: Omit<NormalizedConfig, 'environments'> & {
    pluginNames: string[];
  } = {
    ...rsbuildConfig,
    pluginNames,
  };

  const rawRsbuildConfig = stringifyConfig(
    rsbuildDebugConfig,
    inspectOptions.verbose,
  );

  const environmentConfigs: Record<
    string,
    NormalizedEnvironmentConfig & {
      pluginNames: string[];
    }
  > = {};

  const rawEnvironmentConfigs: Array<{
    name: string;
    content: string;
  }> = [];

  for (const [name, config] of Object.entries(environments)) {
    const debugConfig = {
      ...config,
      pluginNames: pluginManager
        .getPlugins({ environment: name })
        .map((p) => p.name),
    };
    rawEnvironmentConfigs.push({
      name,
      content: stringifyConfig(debugConfig, inspectOptions.verbose),
    });
    environmentConfigs[name] = debugConfig;
  }

  return {
    rsbuildConfig: rsbuildDebugConfig,
    rawRsbuildConfig,
    environmentConfigs,
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
          label: 'Rsbuild Config',
          content,
        };
      }
      const outputFile = `rsbuild.config.${name}.mjs`;
      const outputFilePath = join(outputPath, outputFile);

      return {
        path: outputFilePath,
        label: `Rsbuild Config (${name})`,
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
    `Inspect config succeed, open following files to view the content: \n\n${fileInfos}\n`,
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
    copyOnBuild: true,
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
