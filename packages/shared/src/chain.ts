import type { EntryDescription } from '@rspack/core';
import { NODE_MODULES_REGEX, TS_AND_JSX_REGEX } from './constants';
import { debug } from './logger';
import type {
  CreateAsyncHook,
  ModifyBundlerChainFn,
  ModifyBundlerChainUtils,
  NormalizedConfig,
  RsbuildConfig,
  RsbuildContext,
  RsbuildEntry,
  RspackChain,
  RspackConfig,
} from './types';
import { isPlainObject } from './utils';
import { castArray } from './utils';

export async function getBundlerChain() {
  const { default: RspackChain } = await import(
    '../compiled/rspack-chain/index.js'
  );

  const bundlerChain = new RspackChain();

  return bundlerChain as unknown as RspackChain;
}

export async function modifyBundlerChain(
  context: RsbuildContext & {
    hooks: {
      modifyBundlerChain: CreateAsyncHook<ModifyBundlerChainFn>;
    };
    config: Readonly<RsbuildConfig>;
  },
  utils: ModifyBundlerChainUtils,
): Promise<RspackChain> {
  debug('modify bundler chain');

  const bundlerChain = await getBundlerChain();

  const [modifiedBundlerChain] = await context.hooks.modifyBundlerChain.call(
    bundlerChain,
    utils,
  );

  if (context.config.tools?.bundlerChain) {
    for (const item of castArray(context.config.tools.bundlerChain)) {
      await item(modifiedBundlerChain, utils);
    }
  }

  debug('modify bundler chain done');

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
    /** esbuild-loader */
    ESBUILD: 'esbuild',
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
    /** htmlPreconnectPlugin */
    HTML_PRECONNECT: 'html-preconnect-plugin',
    /** htmlDnsPrefetchPlugin */
    HTML_DNS_PREFETCH: 'html-dns-prefetch-plugin',
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
    /** VueLoader15PitchFixPlugin */
    VUE_LOADER_15_PITCH_FIX_PLUGIN: 'vue-loader-15-pitch-fix',
  },
  /** Predefined minimizers */
  MINIMIZER: {
    /** SwcJsMinimizerRspackPlugin */
    JS: 'js',
    /** SwcCssMinimizerRspackPlugin */
    CSS: 'css',
    /** ESBuildPlugin */
    ESBUILD: 'js-css',
    /** SWCPlugin */
    SWC: 'swc',
  },
  /** Predefined resolve plugins */
  RESOLVE_PLUGIN: {
    /** ModuleScopePlugin */
    MODULE_SCOPE: 'module-scope',
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
  config: NormalizedConfig;
  context: RsbuildContext;
  includes: (string | RegExp)[];
  excludes: (string | RegExp)[];
}) {
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

export function chainToConfig(chain: RspackChain): RspackConfig {
  const config = chain.toConfig();
  const { entry } = config;

  if (!isPlainObject(entry)) {
    return config as RspackConfig;
  }

  const formattedEntry: RsbuildEntry = {};

  /**
   * rspack-chain can not handle entry description object correctly,
   * so we need to format the entry object and correct the entry description object.
   */
  for (const [entryName, entryValue] of Object.entries(entry)) {
    const entryImport: string[] = [];
    let entryDescription: EntryDescription | null = null;

    for (const item of castArray(entryValue)) {
      if (typeof item === 'string') {
        entryImport.push(item);
        continue;
      }

      if (item.import) {
        entryImport.push(...castArray(item.import));
      }

      if (entryDescription) {
        // merge entry description object
        Object.assign(entryDescription, item);
      } else {
        entryDescription = item;
      }
    }

    formattedEntry[entryName] = entryDescription
      ? {
          ...(entryDescription as EntryDescription),
          import: entryImport,
        }
      : entryImport;
  }

  config.entry = formattedEntry;

  return config as RspackConfig;
}
