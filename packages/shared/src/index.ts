import browserslist from '../compiled/browserslist/index.js';
import deepmerge from '../compiled/deepmerge/index.js';
import color from '../compiled/picocolors/index.js';
import RspackChain from '../compiled/rspack-chain/index.js';
import type { CacheGroups } from './types';
import type { NormalizedEnvironmentConfig, RsbuildContext } from './types';

export * from './types';

// RegExp
export const JS_REGEX: RegExp = /\.(?:js|mjs|cjs|jsx)$/;
export const SCRIPT_REGEX: RegExp = /\.(?:js|jsx|mjs|cjs|ts|tsx|mts|cts)$/;
export const TS_AND_JSX_REGEX: RegExp = /\.(?:ts|tsx|jsx|mts|cts)$/;
export const NODE_MODULES_REGEX: RegExp = /[\\/]node_modules[\\/]/;

enum ESVersion {
  es5 = 5,
  es2015 = 2015,
  es2016 = 2016,
  es2017 = 2017,
  es2018 = 2018,
}

// the minimal version for [es2015, es2016, es2017, es2018]
const ES_VERSIONS_MAP: Record<string, number[]> = {
  chrome: [51, 52, 57, 64],
  edge: [15, 15, 15, 79],
  safari: [10, 10.3, 11, 16.4],
  firefox: [54, 54, 54, 78],
  opera: [38, 39, 44, 51],
  samsung: [5, 6.2, 6.2, 8.2],
};

const renameBrowser = (name: string) => {
  return name === 'ios_saf' ? 'safari' : name;
};

export function browserslistToESVersion(browsers: string[]): ESVersion {
  const projectBrowsers = browserslist(browsers, {
    ignoreUnknownVersions: true,
  });

  let esVersion: ESVersion = ESVersion.es2018;

  for (const item of projectBrowsers) {
    const pairs = item.split(' ');

    // skip invalid item
    if (pairs.length < 2) {
      continue;
    }

    const browser = renameBrowser(pairs[0]);
    const version = Number(pairs[1].split('-')[0]);

    // ignore unknown version
    if (Number.isNaN(version)) {
      continue;
    }

    // IE / Android 4.x ~ 5.x only supports es5
    if (browser === 'ie' || (browser === 'android' && version < 6)) {
      esVersion = ESVersion.es5;
      break;
    }

    // skip unknown browsers
    const versions = ES_VERSIONS_MAP[browser];
    if (!versions) {
      continue;
    }

    if (version < versions[0]) {
      esVersion = Math.min(ESVersion.es5, esVersion);
    } else if (version < versions[1]) {
      esVersion = Math.min(ESVersion.es2015, esVersion);
    } else if (version < versions[2]) {
      esVersion = Math.min(ESVersion.es2016, esVersion);
    } else if (version < versions[3]) {
      esVersion = Math.min(ESVersion.es2017, esVersion);
    }
  }

  return esVersion;
}

export { color, deepmerge };

export type Colors = Omit<
  keyof typeof color,
  'createColor' | 'isColorSupported'
>;

export const castArray = <T>(arr?: T | T[]): T[] => {
  if (arr === undefined) {
    return [];
  }
  return Array.isArray(arr) ? arr : [arr];
};

export const cloneDeep = <T>(value: T): T => {
  if (value === null || value === undefined) {
    return value;
  }
  return deepmerge({}, value);
};

const DEP_MATCH_TEMPLATE = /[\\/]node_modules[\\/](<SOURCES>)[\\/]/.source;

/** Expect to match path just like "./node_modules/react-router/" */
export const createDependenciesRegExp = (
  ...dependencies: (string | RegExp)[]
): RegExp => {
  const sources = dependencies.map((d) =>
    typeof d === 'string' ? d : d.source,
  );
  const expr = DEP_MATCH_TEMPLATE.replace('<SOURCES>', sources.join('|'));
  return new RegExp(expr);
};

export function createCacheGroups(
  group: Record<string, (string | RegExp)[]>,
): CacheGroups {
  const experienceCacheGroup: CacheGroups = {};

  for (const [name, pkgs] of Object.entries(group)) {
    const key = `lib-${name}`;

    experienceCacheGroup[key] = {
      test: createDependenciesRegExp(...pkgs),
      priority: 0,
      name: key,
      reuseExistingChunk: true,
    };
  }

  return experienceCacheGroup;
}

export { RspackChain };

export const CHAIN_ID = {
  /** Predefined rules */
  RULE: {
    /** Rule for .mjs */
    MJS: 'mjs',
    /** Rule for fonts */
    FONT: 'font',
    /** Rule for images */
    IMAGE: 'image',
    /** Rule for media */
    MEDIA: 'media',
    /** Rule for js */
    JS: 'js',
    /** Rule for data uri encoded javascript */
    JS_DATA_URI: 'js-data-uri',
    /** Rule for ts */
    TS: 'ts',
    /** Rule for css */
    CSS: 'css',
    /** Rule for less */
    LESS: 'less',
    /** Rule for sass */
    SASS: 'sass',
    /** Rule for stylus */
    STYLUS: 'stylus',
    /** Rule for svg */
    SVG: 'svg',
    /** Rule for pug */
    PUG: 'pug',
    /** Rule for Vue */
    VUE: 'vue',
    /** Rule for yaml */
    YAML: 'yaml',
    /** Rule for wasm */
    WASM: 'wasm',
    /** Rule for svelte */
    SVELTE: 'svelte',
  },
  /** Predefined rule groups */
  ONE_OF: {
    SVG: 'svg',
    SVG_URL: 'svg-asset-url',
    SVG_ASSET: 'svg-asset',
    SVG_REACT: 'svg-react',
    SVG_INLINE: 'svg-asset-inline',
  },
  /** Predefined loaders */
  USE: {
    /** ts-loader */
    TS: 'ts',
    /** css-loader */
    CSS: 'css',
    /** sass-loader */
    SASS: 'sass',
    /** less-loader */
    LESS: 'less',
    /** stylus-loader */
    STYLUS: 'stylus',
    /** url-loader */
    URL: 'url',
    /** pug-loader */
    PUG: 'pug',
    /** vue-loader */
    VUE: 'vue',
    /** swc-loader */
    SWC: 'swc',
    /** svgr */
    SVGR: 'svgr',
    /** plugin-image-compress svgo-loader */
    SVGO: 'svgo',
    /** yaml-loader */
    YAML: 'yaml',
    /** babel-loader */
    BABEL: 'babel',
    /** style-loader */
    STYLE: 'style-loader',
    /** svelte-loader */
    SVELTE: 'svelte',
    /** postcss-loader */
    POSTCSS: 'postcss',
    /** lightningcss-loader */
    LIGHTNINGCSS: 'lightningcss',
    /** ignore-css-loader */
    IGNORE_CSS: 'ignore-css',
    /** css-modules-typescript-loader */
    CSS_MODULES_TS: 'css-modules-typescript',
    /** CssExtractRspackPlugin.loader */
    MINI_CSS_EXTRACT: 'mini-css-extract',
    /** resolve-url-loader */
    RESOLVE_URL: 'resolve-url-loader',
    /** plugin-image-compress.loader */
    IMAGE_COMPRESS: 'image-compress',
  },
  /** Predefined plugins */
  PLUGIN: {
    /** HotModuleReplacementPlugin */
    HMR: 'hmr',
    /** CopyWebpackPlugin */
    COPY: 'copy',
    /** HtmlWebpackPlugin */
    HTML: 'html',
    /** ESLintWebpackPlugin */
    ESLINT: 'eslint',
    /** DefinePlugin */
    DEFINE: 'define',
    /** ProgressPlugin */
    PROGRESS: 'progress',
    /** AppIconPlugin */
    APP_ICON: 'app-icon',
    /** WebpackManifestPlugin */
    MANIFEST: 'webpack-manifest',
    /** ForkTsCheckerWebpackPlugin */
    TS_CHECKER: 'ts-checker',
    /** InlineChunkHtmlPlugin */
    INLINE_HTML: 'inline-html',
    /** WebpackBundleAnalyzer */
    BUNDLE_ANALYZER: 'bundle-analyze',
    /** ModuleFederationPlugin */
    MODULE_FEDERATION: 'module-federation',
    /** HtmlBasicPlugin */
    HTML_BASIC: 'html-basic-plugin',
    /** htmlPrefetchPlugin */
    HTML_PREFETCH: 'html-prefetch-plugin',
    /** htmlPreloadPlugin */
    HTML_PRELOAD: 'html-preload-plugin',
    /** CssExtractRspackPlugin */
    MINI_CSS_EXTRACT: 'mini-css-extract',
    /** VueLoaderPlugin */
    VUE_LOADER_PLUGIN: 'vue-loader-plugin',
    /** ReactFastRefreshPlugin */
    REACT_FAST_REFRESH: 'react-fast-refresh',
    /** ProvidePlugin for node polyfill */
    NODE_POLYFILL_PROVIDE: 'node-polyfill-provide',
    /** WebpackSRIPlugin */
    SUBRESOURCE_INTEGRITY: 'subresource-integrity',
    /** AssetsRetryPlugin */
    ASSETS_RETRY: 'assets-retry',
    /** AsyncChunkRetryPlugin */
    ASYNC_CHUNK_RETRY: 'async-chunk-retry',
    /** AutoSetRootFontSizePlugin */
    AUTO_SET_ROOT_SIZE: 'auto-set-root-size',
  },
  /** Predefined minimizers */
  MINIMIZER: {
    /** SwcJsMinimizerRspackPlugin */
    JS: 'js',
    /** LightningCssMinimizerRspackPlugin */
    CSS: 'css',
  },
  /** Predefined resolve plugins */
  RESOLVE_PLUGIN: {
    /** TsConfigPathsPlugin */
    TS_CONFIG_PATHS: 'ts-config-paths',
  },
} as const;

export type ChainIdentifier = typeof CHAIN_ID;

export function applyScriptCondition({
  rule,
  chain,
  config,
  context,
  includes,
  excludes,
}: {
  rule: RspackChain.Rule;
  chain: RspackChain;
  config: NormalizedEnvironmentConfig;
  context: RsbuildContext;
  includes: (string | RegExp)[];
  excludes: (string | RegExp)[];
}): void {
  // compile all folders in app directory, exclude node_modules
  // which can be removed next version of rspack
  rule.include.add({
    and: [context.rootPath, { not: NODE_MODULES_REGEX }],
  });

  // Always compile TS and JSX files.
  // Otherwise, it will lead to compilation errors and incorrect output.
  rule.include.add(TS_AND_JSX_REGEX);

  // The Rsbuild runtime code is es2017 by default,
  // transform the runtime code if user target < es2017
  const target = castArray(chain.get('target'));
  const legacyTarget = ['es5', 'es6', 'es2015', 'es2016'];
  if (legacyTarget.some((item) => target.includes(item))) {
    rule.include.add(/[\\/]@rsbuild[\\/]core[\\/]dist[\\/]/);
  }

  for (const condition of [...includes, ...(config.source.include || [])]) {
    rule.include.add(condition);
  }

  for (const condition of [...excludes, ...(config.source.exclude || [])]) {
    rule.exclude.add(condition);
  }
}
