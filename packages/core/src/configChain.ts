import RspackChain from '../compiled/rspack-chain/index.js';
import { castArray } from './helpers';
import { logger } from './logger';
import type { InternalContext, ModifyBundlerChainUtils } from './types';

export async function modifyBundlerChain(
  context: InternalContext,
  utils: ModifyBundlerChainUtils,
): Promise<RspackChain> {
  logger.debug('modify bundler chain');

  const bundlerChain = new RspackChain();

  const [modifiedBundlerChain] =
    await context.hooks.modifyBundlerChain.callChain({
      environment: utils.environment.name,
      args: [bundlerChain, utils],
    });

  if (utils.environment.config.tools?.bundlerChain) {
    for (const item of castArray(utils.environment.config.tools.bundlerChain)) {
      await item(modifiedBundlerChain, utils);
    }
  }

  logger.debug('modify bundler chain done');

  return modifiedBundlerChain;
}

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
    /** Rule for additional assets */
    ADDITIONAL_ASSETS: 'additional-assets',
    /** Rule for js */
    JS: 'js',
    /** Rule for data uri encoded javascript */
    JS_DATA_URI: 'js-data-uri',
    /** Rule for ts */
    TS: 'ts',
    /** Rule for CSS */
    CSS: 'css',
    /** Rule for raw CSS */
    CSS_RAW: 'css-raw',
    /** Rule for inline CSS */
    CSS_INLINE: 'css-inline',
    /** Rule for Less */
    LESS: 'less',
    /** Rule for raw Less */
    LESS_RAW: 'less-raw',
    /** Rule for inline Less */
    LESS_INLINE: 'less-inline',
    /** Rule for Sass */
    SASS: 'sass',
    /** Rule for raw Sass */
    SASS_RAW: 'sass-raw',
    /** Rule for inline Sass */
    SASS_INLINE: 'sass-inline',
    /** Rule for stylus */
    STYLUS: 'stylus',
    /** Rule for raw stylus */
    STYLUS_RAW: 'stylus-raw',
    /** Rule for inline stylus */
    STYLUS_INLINE: 'stylus-inline',
    /** Rule for svg */
    SVG: 'svg',
    /** Rule for pug */
    PUG: 'pug',
    /** Rule for Vue */
    VUE: 'vue',
    /** Rule for wasm */
    WASM: 'wasm',
    /** Rule for svelte */
    SVELTE: 'svelte',
  },
  /** Predefined rule groups */
  ONE_OF: {
    SVG: 'svg',
    SVG_RAW: 'svg-asset-raw',
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
  },
  /** Predefined plugins */
  PLUGIN: {
    /** HotModuleReplacementPlugin */
    HMR: 'hmr',
    /** CopyRspackPlugin */
    COPY: 'copy',
    /** HtmlRspackPlugin */
    HTML: 'html',
    /** DefinePlugin */
    DEFINE: 'define',
    /** ProgressPlugin */
    PROGRESS: 'progress',
    /** WebpackManifestPlugin */
    MANIFEST: 'webpack-manifest',
    /** ForkTsCheckerWebpackPlugin */
    TS_CHECKER: 'ts-checker',
    /** WebpackBundleAnalyzer */
    BUNDLE_ANALYZER: 'bundle-analyze',
    /** ModuleFederationPlugin */
    MODULE_FEDERATION: 'module-federation',
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
    /** SubresourceIntegrityPlugin */
    SUBRESOURCE_INTEGRITY: 'subresource-integrity',
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
