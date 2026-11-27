import { dirname, isAbsolute, join } from 'node:path';
import {
  ALL_INTERFACES_IPV4,
  ASSETS_DIST_DIR,
  CSS_DIST_DIR,
  DEFAULT_ASSET_PREFIX,
  DEFAULT_DATA_URL_SIZE,
  DEFAULT_MOUNT_ID,
  DEFAULT_PORT,
  DEFAULT_STACK_TRACE,
  FAVICON_DIST_DIR,
  FONT_DIST_DIR,
  HMR_SOCKET_PATH,
  HTML_DIST_DIR,
  IMAGE_DIST_DIR,
  LOCALHOST,
  MEDIA_DIST_DIR,
  ROOT_DIST_DIR,
  SVG_DIST_DIR,
  TS_CONFIG_FILE,
  WASM_DIST_DIR,
} from './constants';
import { getNodeEnv, require } from './helpers';
import { findExists, isFileExists } from './helpers/fs';
import { mergeRsbuildConfig } from './mergeConfig';
import type {
  CSSConfig,
  CSSModulesConfig,
  CSSModulesLocalsConvention,
  EnvironmentConfig,
  NormalizedConfig,
  NormalizedCSSConfig,
  NormalizedCSSModulesConfig,
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
  RsbuildTarget,
  Rspack,
} from './types';

const getDefaultDevConfig = (): Omit<NormalizedDevConfig, 'hmr'> => ({
  liveReload: true,
  browserLogs: {
    stackTrace: DEFAULT_STACK_TRACE,
  },
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
    logLevel: 'info',
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

const getDefaultServerConfig = (): Omit<
  NormalizedServerConfig,
  'publicDir'
> => ({
  port: DEFAULT_PORT,
  host: LOCALHOST,
  allowedHosts: true,
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
      version: '2023-11',
    },
  };
};

const getDefaultHtmlConfig = (): NormalizedHtmlConfig => ({
  meta: {
    charset: { charset: 'utf-8' },
    viewport: 'width=device-width, initial-scale=1.0',
  },
  title: 'Rsbuild App',
  inject: 'head',
  mountId: DEFAULT_MOUNT_ID,
  crossorigin: false,
  outputStructure: 'flat',
  scriptLoading: 'defer',
  implementation: 'js',
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
  printFileSize: true,
  removeConsole: false,
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
  manifest: false,
  sourceMap: {
    js: undefined,
    css: false,
    extract: false,
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
  splitChunks: {},
  performance: getDefaultPerformanceConfig(),
  environments: {},
  logLevel: 'info',
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
  userConfig: RsbuildConfig,
): Promise<RsbuildConfig> => {
  const config = mergeRsbuildConfig(createDefaultConfig(), userConfig);

  config.root ||= rootPath;
  config.source ||= {};

  // Inherit server.base to output.assetPrefix and dev.assetPrefix if not specified
  if (config.server?.base) {
    if (userConfig.dev?.assetPrefix === undefined) {
      config.dev ||= {};
      config.dev.assetPrefix = config.server.base;
    }

    if (userConfig.output?.assetPrefix === undefined) {
      config.output ||= {};
      config.output.assetPrefix = config.server.base;
    }
  }

  // Inherit logLevel to dev.client.logLevel if not specified
  if (userConfig.dev?.client?.logLevel === undefined) {
    config.dev ||= {};
    config.dev.client ||= {};
    config.dev.client.logLevel = config.logLevel;
  }

  // Enable lazyCompilation imports by default
  if (config.dev?.lazyCompilation === undefined) {
    config.dev ||= {};
    config.dev.lazyCompilation = {
      imports: true,
      entries: false,
    };
  }

  // Auto detect tsconfigPath
  if (!config.source.tsconfigPath) {
    const tsconfigPath = join(rootPath, TS_CONFIG_FILE);

    if (await isFileExists(tsconfigPath)) {
      config.source.tsconfigPath = tsconfigPath;
    }
  }

  return config;
};

const CSS_MODULES_LOCALS_CONVENTION_MAP: Record<
  CSSModulesLocalsConvention,
  Rspack.CssGeneratorExportsConvention
> = {
  asIs: 'as-is',
  camelCase: 'camel-case',
  camelCaseOnly: 'camel-case-only',
  dashes: 'dashes',
  dashesOnly: 'dashes-only',
};

const RSPACK_HASH_FUNCTIONS = new Set<string>(['xxhash64', 'md4', 'sha256']);
const RSPACK_HASH_DIGESTS = new Set<string>([
  'hex',
  'base64',
  'base64url',
  'base62',
  'base58',
  'base52',
  'base49',
  'base36',
  'base32',
  'base26',
]);

export const parseLegacyLocalIdentName = (
  template: string,
): Pick<
  CSSModulesConfig,
  | 'localIdentName'
  | 'localIdentHashFunction'
  | 'localIdentHashDigest'
  | 'localIdentHashDigestLength'
> => {
  let localIdentHashFunction: CSSModulesConfig['localIdentHashFunction'];
  let localIdentHashDigest: CSSModulesConfig['localIdentHashDigest'];
  let localIdentHashDigestLength: CSSModulesConfig['localIdentHashDigestLength'];

  const localIdentName = template.replace(
    /\[(?:([a-z0-9]+):)?(hash|fullhash)(?::([^\]]+))?\]/gi,
    (match, rawFn?: string, kind?: string, rest?: string) => {
      let parsedFn: string | undefined;
      if (rawFn !== undefined) {
        const lowerFn = rawFn.toLowerCase();
        if (!RSPACK_HASH_FUNCTIONS.has(lowerFn)) {
          return match;
        }
        parsedFn = lowerFn;
      }

      let parsedDigest: string | undefined;
      let parsedLength: number | undefined;
      if (rest !== undefined) {
        const parts = rest.split(':');
        if (parts.length === 1) {
          const part = parts[0];
          if (/^\d+$/.test(part)) {
            parsedLength = Number(part);
          } else {
            const lowerDigest = part.toLowerCase();
            if (!RSPACK_HASH_DIGESTS.has(lowerDigest)) {
              return match;
            }
            parsedDigest = lowerDigest;
          }
        } else if (parts.length === 2) {
          const [rawDigest, rawLen] = parts;
          const lowerDigest = rawDigest.toLowerCase();
          if (!RSPACK_HASH_DIGESTS.has(lowerDigest) || !/^\d+$/.test(rawLen)) {
            return match;
          }
          parsedDigest = lowerDigest;
          parsedLength = Number(rawLen);
        } else {
          return match;
        }
      }

      if (parsedFn !== undefined) {
        localIdentHashFunction = parsedFn;
      }
      if (parsedDigest !== undefined) {
        // css-loader's `base64` produces CSS-ident-safe chars matching Rspack's `base64url`
        localIdentHashDigest =
          parsedDigest === 'base64' ? 'base64url' : parsedDigest;
      }
      if (parsedLength !== undefined && parsedLength > 0) {
        localIdentHashDigestLength = parsedLength;
      }

      return `[${(kind ?? 'hash').toLowerCase()}]`;
    },
  );

  return {
    localIdentName,
    ...(localIdentHashFunction !== undefined ? { localIdentHashFunction } : {}),
    ...(localIdentHashDigest !== undefined ? { localIdentHashDigest } : {}),
    ...(localIdentHashDigestLength !== undefined
      ? { localIdentHashDigestLength }
      : {}),
  };
};

export const getDefaultCssModulesConfig = (): NormalizedCSSModulesConfig => ({
  localIdentHashDigest: 'base64url',
  localIdentHashDigestLength: 6,
  localIdentHashFunction: 'xxhash64',
  localIdentName: '[local]-[hash]',
  animation: true,
  dashedIdents: false,
  customIdents: false,
  container: false,
  grid: false,
  function: false,
  pure: false,
});

export const getDefaultCssConfig = (
  target: RsbuildTarget = 'web',
  exportType: Rspack.CssParserExportType = 'link',
): NormalizedCSSConfig => ({
  exportType: 'link',
  namedExports: exportType === 'text' || exportType === 'css-style-sheet',
  exportsConvention: 'camel-case',
  exportsOnly: target !== 'web',
  esModule: true,
  modules: getDefaultCssModulesConfig(),
});

type LegacyCssOutputConfig = Partial<
  Pick<
    NormalizedOutputConfig,
    'target' | 'injectStyles' | 'emitCss' | 'cssModules'
  >
>;

export function normalizeCssConfig(
  css: undefined,
  output?: LegacyCssOutputConfig,
): undefined;
export function normalizeCssConfig(
  css: false,
  output?: LegacyCssOutputConfig,
): false;
export function normalizeCssConfig(
  css: true | CSSConfig,
  output?: LegacyCssOutputConfig,
): NormalizedCSSConfig;
export function normalizeCssConfig(
  css?: boolean | CSSConfig,
  output?: LegacyCssOutputConfig,
): NormalizedCSSConfig | false | undefined;
export function normalizeCssConfig(
  css?: boolean | CSSConfig,
  output?: LegacyCssOutputConfig,
): NormalizedCSSConfig | false | undefined {
  if (css === undefined || css === false) {
    return css;
  }

  const target = output?.target ?? 'web';
  const legacyCssModules = output?.cssModules;
  const userCss = css === true ? {} : css;

  const exportType =
    userCss.exportType ?? (output?.injectStyles ? 'style' : 'link');
  const exportsOnly =
    userCss.exportsOnly ??
    (output?.emitCss !== undefined ? !output.emitCss : target !== 'web');
  const namedExports =
    userCss.namedExports ??
    (legacyCssModules?.namedExport
      ? true
      : exportType === 'text' || exportType === 'css-style-sheet');
  const exportsConvention =
    userCss.exportsConvention ??
    (legacyCssModules?.exportLocalsConvention
      ? (CSS_MODULES_LOCALS_CONVENTION_MAP[
          legacyCssModules.exportLocalsConvention
        ] ?? 'camel-case')
      : 'camel-case');
  const esModule = userCss.esModule ?? true;

  const legacyLocalIdent =
    userCss.modules?.localIdentName === undefined &&
    legacyCssModules?.localIdentName !== undefined
      ? parseLegacyLocalIdentName(legacyCssModules.localIdentName)
      : undefined;
  const legacyModulesFallback: CSSModulesConfig = {
    ...legacyLocalIdent,
    ...(legacyCssModules?.mode === 'pure' ? { pure: true } : {}),
  };

  const modules = mergeRsbuildConfig<NormalizedCSSModulesConfig>(
    getDefaultCssModulesConfig(),
    legacyModulesFallback as NormalizedCSSModulesConfig,
    userCss.modules as NormalizedCSSModulesConfig,
  );

  return {
    exportType,
    namedExports,
    exportsConvention,
    exportsOnly,
    esModule,
    modules,
  };
}

type NormalizedBaseConfig = Omit<NormalizedConfig, 'environments' | 'css'> & {
  css?: boolean | CSSConfig;
  environments: Record<string, EnvironmentConfig>;
};

/**
 * Normalizes the user configuration by merging it with defaults and ensuring
 * consistent structure.
 */
export const normalizeConfig = (
  config: RsbuildConfig,
  rootPath: string,
): NormalizedBaseConfig => {
  const getMode = (): RsbuildMode => {
    if (config.mode) {
      return config.mode;
    }
    const nodeEnv = getNodeEnv();
    return nodeEnv === 'production' || nodeEnv === 'development'
      ? nodeEnv
      : 'none';
  };

  config.server ||= {};
  config.server.host = normalizeHost(config.server.host);
  config.server.publicDir = normalizePublicDirs(
    rootPath,
    config.server.publicDir,
  );

  const defaultConfig = createDefaultConfig();
  defaultConfig.mode = getMode();
  defaultConfig.dev = {
    ...defaultConfig.dev,
    hmr: defaultConfig.mode === 'development',
  };

  const mergedConfig = mergeRsbuildConfig(defaultConfig, config);

  return mergedConfig as NormalizedBaseConfig;
};

const normalizeHost = (host?: string | boolean): string => {
  if (typeof host === 'string') {
    return host;
  }
  return host === true ? ALL_INTERFACES_IPV4 : LOCALHOST;
};

export const normalizePublicDirs = (
  rootPath: string,
  publicDir?: PublicDir,
): Required<PublicDirOptions>[] => {
  if (publicDir === false) {
    return [];
  }

  const defaultConfig: Required<PublicDirOptions> = {
    name: join(rootPath, 'public'),
    copyOnBuild: 'auto',
    watch: false,
    ignore: [],
  };

  // enable public dir by default
  if (publicDir === undefined) {
    return [defaultConfig];
  }

  const mergeWithDefault = (options: PublicDirOptions) => {
    if (options.name === '') {
      throw new Error(
        '[rsbuild:config] `publicDir.name` cannot be empty string.',
      );
    }

    const merged = {
      ...defaultConfig,
      ...options,
    };
    if (!isAbsolute(merged.name)) {
      merged.name = join(rootPath, merged.name);
    }
    return merged;
  };

  if (Array.isArray(publicDir)) {
    return publicDir.map((options) => mergeWithDefault(options));
  }

  return [mergeWithDefault(publicDir)];
};
