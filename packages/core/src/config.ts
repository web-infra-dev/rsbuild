import fs from 'node:fs';
import { isAbsolute, join } from 'node:path';
import {
  DEFAULT_ASSET_PREFIX,
  RspackChain,
  color,
  isObject,
} from '@rsbuild/shared';
import type {
  InspectConfigOptions,
  NormalizedConfig,
  NormalizedDevConfig,
  NormalizedHtmlConfig,
  NormalizedOutputConfig,
  NormalizedPerformanceConfig,
  NormalizedSecurityConfig,
  NormalizedServerConfig,
  NormalizedSourceConfig,
  NormalizedToolsConfig,
  PublicDir,
  PublicDirOptions,
  RsbuildConfig,
  RsbuildEntry,
} from '@rsbuild/shared';
import {
  CSS_DIST_DIR,
  DEFAULT_DATA_URL_SIZE,
  DEFAULT_DEV_HOST,
  DEFAULT_MOUNT_ID,
  DEFAULT_PORT,
  FONT_DIST_DIR,
  HMR_SOCKET_PATH,
  HTML_DIST_DIR,
  IMAGE_DIST_DIR,
  JS_DIST_DIR,
  MEDIA_DIST_DIR,
  ROOT_DIST_DIR,
  SERVER_DIST_DIR,
  SERVICE_WORKER_DIST_DIR,
  SVG_DIST_DIR,
  TS_CONFIG_FILE,
  WASM_DIST_DIR,
} from './constants';
import {
  debounce,
  findExists,
  getNodeEnv,
  isFileExists,
  upperFirst,
} from './helpers';
import { logger } from './logger';
import { mergeRsbuildConfig } from './mergeConfig';
import { restartDevServer } from './server/restart';

const getDefaultDevConfig = (): NormalizedDevConfig => ({
  hmr: true,
  liveReload: true,
  assetPrefix: DEFAULT_ASSET_PREFIX,
  startUrl: false,
  writeToDisk: false,
  client: {
    path: HMR_SOCKET_PATH,
    // By default it is set to "location.port"
    port: '',
    // By default it is set to "location.hostname"
    host: '',
    overlay: true,
  },
});

const getDefaultServerConfig = (): NormalizedServerConfig => ({
  port: DEFAULT_PORT,
  host: DEFAULT_DEV_HOST,
  open: false,
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
    version: 'legacy',
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
  targets: ['web'],
  distPath: {
    root: ROOT_DIST_DIR,
    js: JS_DIST_DIR,
    css: CSS_DIST_DIR,
    svg: SVG_DIST_DIR,
    font: FONT_DIST_DIR,
    html: HTML_DIST_DIR,
    wasm: WASM_DIST_DIR,
    image: IMAGE_DIST_DIR,
    media: MEDIA_DIST_DIR,
    server: SERVER_DIST_DIR,
    worker: SERVICE_WORKER_DIST_DIR,
  },
  assetPrefix: DEFAULT_ASSET_PREFIX,
  filename: {},
  charset: 'ascii',
  polyfill: 'usage',
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
  emitAssets: () => true,
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

function getDefaultEntry(root: string): RsbuildEntry {
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
) => {
  const merged = mergeRsbuildConfig(createDefaultConfig(), config);

  merged.source ||= {};

  if (!merged.source.entry) {
    merged.source.entry = getDefaultEntry(rootPath);
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
export const normalizeConfig = (config: RsbuildConfig): NormalizedConfig =>
  mergeRsbuildConfig(
    createDefaultConfig(),
    config,
  ) as unknown as NormalizedConfig;

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

  try {
    const { default: jiti } = await import('jiti');
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
  } catch (err) {
    logger.error(`Failed to load file: ${color.dim(configFilePath)}`);
    throw err;
  }
}

export async function outputInspectConfigFiles({
  rsbuildConfig,
  rawRsbuildConfig,
  bundlerConfigs,
  inspectOptions,
  configType,
}: {
  configType: string;
  rsbuildConfig: NormalizedConfig;
  rawRsbuildConfig: string;
  bundlerConfigs: string[];
  inspectOptions: InspectConfigOptions & {
    outputPath: string;
  };
}) {
  const { outputPath } = inspectOptions;

  const files = [
    {
      path: join(outputPath, 'rsbuild.config.mjs'),
      label: 'Rsbuild Config',
      content: rawRsbuildConfig,
    },
    ...bundlerConfigs.map((content, index) => {
      const suffix = rsbuildConfig.output.targets[index];
      const outputFile = `${configType}.config.${suffix}.mjs`;
      let outputFilePath = join(outputPath, outputFile);

      // if filename is conflict, add a random id to the filename.
      if (fs.existsSync(outputFilePath)) {
        outputFilePath = outputFilePath.replace(/\.mjs$/, `.${Date.now()}.mjs`);
      }

      return {
        path: outputFilePath,
        label: `${upperFirst(configType)} Config (${suffix})`,
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

export async function stringifyConfig(config: unknown, verbose?: boolean) {
  // webpackChain.toString can be used as a common stringify method
  const stringify = RspackChain.toString as (
    config: unknown,
    options: { verbose?: boolean },
  ) => string;

  return stringify(config as any, { verbose });
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
