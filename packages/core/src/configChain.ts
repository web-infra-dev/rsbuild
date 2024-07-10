import RspackChain from 'rspack-chain';
import { castArray, isPlainObject } from './helpers';
import { logger } from './logger';
import type {
  CreateAsyncHook,
  ModifyBundlerChainFn,
  ModifyBundlerChainUtils,
  RsbuildConfig,
  RsbuildContext,
  RsbuildEntry,
  Rspack,
  RspackConfig,
} from './types';

export function getBundlerChain(): RspackChain {
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
  logger.debug('modify bundler chain');

  const bundlerChain = getBundlerChain();

  const [modifiedBundlerChain] = await context.hooks.modifyBundlerChain.call(
    bundlerChain,
    utils,
  );

  if (utils.environment.config.tools?.bundlerChain) {
    for (const item of castArray(utils.environment.config.tools.bundlerChain)) {
      await item(modifiedBundlerChain, utils);
    }
  }

  logger.debug('modify bundler chain done');

  return modifiedBundlerChain;
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
    let entryDescription: Rspack.EntryDescription | null = null;

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
          ...entryDescription,
          import: entryImport,
        }
      : entryImport;
  }

  config.entry = formattedEntry;

  return config as RspackConfig;
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
    /** CopyRspackPlugin */
    COPY: 'copy',
    /** HtmlRspackPlugin */
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
