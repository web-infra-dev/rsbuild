import { UniBuilderRspackConfig } from '../types';

export const DEFAULT_PORT = 8080;
export const DEFAULT_DATA_URL_SIZE = 10000;
export const DEFAULT_MOUNT_ID = 'root';
export const DEFAULT_ASSET_PREFIX = '/';
export const DEFAULT_DEV_HOST = '0.0.0.0';

export const getDefaultDevConfig = () => ({
  hmr: true,
  https: false,
  port: DEFAULT_PORT,
  assetPrefix: DEFAULT_ASSET_PREFIX,
  startUrl: false,
  progressBar: true,
  host: DEFAULT_DEV_HOST,
});

export const getDefaultSourceConfig = (): UniBuilderRspackConfig['source'] => ({
  alias: {},
  aliasStrategy: 'prefer-tsconfig',
  preEntry: [],
  globalVars: {},
  define: {},
});

export const getDefaultHtmlConfig = (): UniBuilderRspackConfig['html'] => ({
  inject: 'head',
  mountId: DEFAULT_MOUNT_ID,
  crossorigin: false,
  disableHtmlFolder: false,
  scriptLoading: 'defer',
});

export const getDefaultSecurityConfig = () => ({
  nonce: '',
  checkSyntax: false,
});

export const getDefaultToolsConfig = () => ({
  tsChecker: {},
});

export const getDefaultExperimentsConfig = () => ({
  sourceBuild: false,
});

export const getDefaultPerformanceConfig =
  (): UniBuilderRspackConfig['performance'] => ({
    profile: false,
    buildCache: true,
    printFileSize: true,
    removeConsole: false,
    transformLodash: true,
    removeMomentLocale: false,
    chunkSplit: {
      strategy: 'split-by-experience',
    },
  });

export const ROOT_DIST_DIR = 'dist';
export const HTML_DIST_DIR = 'html';
export const SERVER_DIST_DIR = 'bundles';
export const SERVER_WORKER_DIST_DIR = 'worker';
export const JS_DIST_DIR = 'static/js';
export const CSS_DIST_DIR = 'static/css';
export const SVG_DIST_DIR = 'static/svg';
export const FONT_DIST_DIR = 'static/font';
export const WASM_DIST_DIR = 'static/wasm';
export const IMAGE_DIST_DIR = 'static/image';
export const MEDIA_DIST_DIR = 'static/media';

export const getDefaultOutputConfig = (): UniBuilderRspackConfig['output'] => ({
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
    worker: SERVER_WORKER_DIST_DIR,
  },
  assetPrefix: DEFAULT_ASSET_PREFIX,
  filename: {},
  charset: 'ascii',
  polyfill: 'entry',
  dataUriLimit: {
    svg: DEFAULT_DATA_URL_SIZE,
    font: DEFAULT_DATA_URL_SIZE,
    image: DEFAULT_DATA_URL_SIZE,
    media: DEFAULT_DATA_URL_SIZE,
  },
  legalComments: 'linked',
  cleanDistPath: true,
  svgDefaultExport: 'url',
  disableSvgr: false,
  disableCssExtract: false,
  disableMinimize: false,
  disableSourceMap: {
    js: false,
    css: undefined,
  },
  disableTsChecker: false,
  disableFilenameHash: false,
  disableCssModuleExtension: false,
  disableInlineRuntimeChunk: false,
  enableAssetFallback: false,
  enableAssetManifest: false,
  enableLatestDecorators: false,
  enableCssModuleTSDeclaration: false,
  enableInlineScripts: false,
  enableInlineStyles: false,
  cssModules: {
    exportLocalsConvention: 'camelCase',
  },
});
