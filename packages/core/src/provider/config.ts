import { join } from 'node:path';
import {
  findExists,
  isFileExists,
  mergeRsbuildConfig,
  DEFAULT_PORT,
  JS_DIST_DIR,
  CSS_DIST_DIR,
  SVG_DIST_DIR,
  ROOT_DIST_DIR,
  HTML_DIST_DIR,
  FONT_DIST_DIR,
  WASM_DIST_DIR,
  IMAGE_DIST_DIR,
  MEDIA_DIST_DIR,
  TS_CONFIG_FILE,
  SERVER_DIST_DIR,
  DEFAULT_DEV_HOST,
  DEFAULT_MOUNT_ID,
  DEFAULT_ASSET_PREFIX,
  DEFAULT_DATA_URL_SIZE,
  SERVICE_WORKER_DIST_DIR,
} from '@rsbuild/shared';
import type {
  RsbuildEntry,
  RsbuildConfig,
  NormalizedConfig,
  NormalizedDevConfig,
  NormalizedToolsConfig,
  NormalizedHtmlConfig,
  NormalizedOutputConfig,
  NormalizedSourceConfig,
  NormalizedServerConfig,
  NormalizedSecurityConfig,
  NormalizedPerformanceConfig,
} from '@rsbuild/shared';
const getDefaultDevConfig = (): NormalizedDevConfig => ({
  hmr: true,
  liveReload: true,
  assetPrefix: DEFAULT_ASSET_PREFIX,
  startUrl: false,
});

const getDefaultServerConfig = (): NormalizedServerConfig => ({
  port: DEFAULT_PORT,
  host: DEFAULT_DEV_HOST,
  htmlFallback: 'index',
  compress: true,
  printUrls: true,
  strictPort: false,
  publicDir: {
    name: 'public',
    copyOnBuild: true,
  },
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
});

const getDefaultToolsConfig = (): NormalizedToolsConfig => ({
  cssExtract: {
    loaderOptions: {},
    pluginOptions: {},
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
  disableMinimize: false,
  sourceMap: {
    js: undefined,
    css: false,
  },
  filenameHash: true,
  enableCssModuleTSDeclaration: false,
  inlineScripts: false,
  inlineStyles: false,
  cssModules: {
    auto: true,
    exportLocalsConvention: 'camelCase',
  },
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
});

function getDefaultEntry(root: string): RsbuildEntry {
  const files = [
    // Most projects are using typescript now.
    // So we put `.ts` as the first one to improve performance.
    'ts',
    'js',
    'tsx',
    'jsx',
    '.mjs',
    '.cjs',
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
  mergeRsbuildConfig(createDefaultConfig(), config) as NormalizedConfig;
