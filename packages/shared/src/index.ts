import RspackChain from '../compiled/rspack-chain/index.js';
import type { CacheGroups } from './types';

export * from './types';

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
