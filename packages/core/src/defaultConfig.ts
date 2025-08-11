import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import {
  ASSETS_DIST_DIR,
  CSS_DIST_DIR,
  DEFAULT_ASSET_PREFIX,
  DEFAULT_DATA_URL_SIZE,
  DEFAULT_DEV_HOST,
  DEFAULT_MOUNT_ID,
  DEFAULT_PORT,
  FAVICON_DIST_DIR,
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
import { findExists, getNodeEnv, isFileExists } from './helpers';
import { mergeRsbuildConfig } from './mergeConfig';
import type {
  NormalizedConfig,
  NormalizedDevConfig,
  NormalizedHtmlConfig,
  NormalizedOutputConfig,
  NormalizedPerformanceConfig,
  NormalizedResolveConfig,
  NormalizedSecurityConfig,
  NormalizedServerConfig,
  NormalizedSourceConfig,
  NormalizedToolsConfig,
  PublicDir,
  PublicDirOptions,
  RsbuildConfig,
  RsbuildEntry,
  RsbuildMode,
} from './types';

const require = createRequire(import.meta.url);

const getDefaultDevConfig = (): NormalizedDevConfig => ({
  hmr: true,
  liveReload: true,
  watchFiles: [],
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
 *
 * Can be used in `server.cors.origin` config.
 * @example
 * ```ts
 * server: {
 *   cors: {
 *     origin: [defaultAllowedOrigins, 'https://example.com'],
 *   },
 * }
 * ```
 */
export const defaultAllowedOrigins: RegExp =
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
    origin: defaultAllowedOrigins,
  },
  middlewareMode: false,
});

let swcHelpersPath: string;

const getDefaultSourceConfig = (): NormalizedSourceConfig => {
  return {
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
    favicon: FAVICON_DIST_DIR,
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

  if (merged.dev?.lazyCompilation === undefined) {
    merged.dev ||= {};
    merged.dev.lazyCompilation = {
      imports: true,
      entries: false,
    };
  }

  if (!merged.source.tsconfigPath) {
    const tsconfigPath = join(rootPath, TS_CONFIG_FILE);

    if (await isFileExists(tsconfigPath)) {
      merged.source.tsconfigPath = tsconfigPath;
    }
  }

  return merged;
};

/**
 * Merges user config with default values to ensure required properties
 * are initialized.
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

  const mergedConfig = mergeRsbuildConfig(
    {
      ...createDefaultConfig(),
      mode: getMode(),
    },
    config,
  ) as Required<RsbuildConfig>;

  const { watchFiles } = mergedConfig.dev as NormalizedDevConfig;
  if (!Array.isArray(watchFiles)) {
    mergedConfig.dev.watchFiles = [watchFiles];
  }

  return mergedConfig as unknown as NormalizedConfig;
};

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
