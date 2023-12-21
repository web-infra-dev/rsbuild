import { posix } from 'path';
import { getDistPath, getFilename } from './fs';
import { addTrailingSlash } from './utils';
import { castArray, ensureAbsolutePath } from './utils';
import { debug } from './logger';
import {
  DEFAULT_PORT,
  TS_AND_JSX_REGEX,
  DEFAULT_DEV_HOST,
  NODE_MODULES_REGEX,
  DEFAULT_ASSET_PREFIX,
} from './constants';
import type {
  Context,
  BundlerChain,
  RsbuildConfig,
  ChainedConfig,
  CreateAsyncHook,
  BundlerChainRule,
  NormalizedConfig,
  RsbuildPluginAPI,
  ModifyBundlerChainFn,
  ModifyBundlerChainUtils,
} from './types';
import { mergeChainedOptions } from './mergeChainedOptions';

export async function getBundlerChain() {
  const { default: WebpackChain } = await import('../compiled/webpack-chain');

  const bundlerChain = new WebpackChain();

  return bundlerChain as unknown as BundlerChain;
}

export async function modifyBundlerChain(
  context: Context & {
    hooks: {
      modifyBundlerChainHook: CreateAsyncHook<ModifyBundlerChainFn>;
    };
    config: Readonly<RsbuildConfig>;
  },
  utils: ModifyBundlerChainUtils,
): Promise<BundlerChain> {
  debug('modify bundler chain');

  const bundlerChain = await getBundlerChain();

  const [modifiedBundlerChain] =
    await context.hooks.modifyBundlerChainHook.call(bundlerChain, utils);

  if (context.config.tools?.bundlerChain) {
    castArray(context.config.tools.bundlerChain).forEach((item) => {
      item(modifiedBundlerChain, utils);
    });
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
    /** Rule for toml */
    TOML: 'toml',
    /** Rule for yaml */
    YAML: 'yaml',
    /** Rule for wasm */
    WASM: 'wasm',
    /** Rule for node */
    NODE: 'node',
    /** Rule for svelte */
    SVELTE: 'svelte',
  },
  /** Predefined rule groups */
  ONE_OF: {
    SVG: 'svg',
    SVG_URL: 'svg-url',
    SVG_ASSET: 'svg-asset',
    SVG_INLINE: 'svg-inline',
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
    /** @svgr/webpack */
    SVGR: 'svgr',
    /** yaml-loader */
    YAML: 'yaml',
    /** toml-loader */
    TOML: 'toml',
    /** node-loader */
    NODE: 'node',
    /** babel-loader */
    BABEL: 'babel',
    /** esbuild-loader */
    ESBUILD: 'esbuild',
    /** swc-loader */
    SWC: 'swc',
    /** style-loader */
    STYLE: 'style-loader',
    /** postcss-loader */
    POSTCSS: 'postcss',
    /** ignore-css-loader */
    IGNORE_CSS: 'ignore-css',
    /** css-modules-typescript-loader */
    CSS_MODULES_TS: 'css-modules-typescript',
    /** mini-css-extract-plugin.loader */
    MINI_CSS_EXTRACT: 'mini-css-extract',
    /** resolve-url-loader */
    RESOLVE_URL_LOADER_FOR_SASS: 'resolve-url-loader',
    /** plugin-image-compress.loader */
    IMAGE_COMPRESS: 'image-compress',
    /** plugin-image-compress svgo-loader */
    SVGO: 'svgo',
    /** svelte-loader */
    SVELTE: 'svelte',
  },
  /** Predefined plugins */
  PLUGIN: {
    /** HotModuleReplacementPlugin */
    HMR: 'hmr',
    /** CopyWebpackPlugin */
    COPY: 'copy',
    /** HtmlWebpackPlugin */
    HTML: 'html',
    /** DefinePlugin */
    DEFINE: 'define',
    /** IgnorePlugin */
    IGNORE: 'ignore',
    /** BannerPlugin */
    BANNER: 'banner',
    /** ProgressPlugin */
    PROGRESS: 'progress',
    /** Inspector */
    INSPECTOR: 'inspector',
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
    /** HtmlTagsPlugin */
    HTML_TAGS: 'html-tags',
    /** HtmlBasicPlugin */
    HTML_BASIC: 'html-basic',
    /** HtmlNoncePlugin */
    HTML_NONCE: 'html-nonce',
    /** HtmlCrossOriginPlugin */
    HTML_CROSS_ORIGIN: 'html-cross-origin',
    /** htmlPreconnectPlugin */
    HTML_PRECONNECT: 'html-preconnect-plugin',
    /** htmlDnsPrefetchPlugin */
    HTML_DNS_PREFETCH: 'html-dns-prefetch-plugin',
    /** htmlPrefetchPlugin */
    HTML_PREFETCH: 'html-prefetch-plugin',
    /** htmlPreloadPlugin */
    HTML_PRELOAD: 'html-preload-plugin',
    /** MiniCssExtractPlugin */
    MINI_CSS_EXTRACT: 'mini-css-extract',
    /** VueLoaderPlugin */
    VUE_LOADER_PLUGIN: 'vue-loader-plugin',
    /** ReactFastRefreshPlugin */
    REACT_FAST_REFRESH: 'react-fast-refresh',
    /** ProvidePlugin for node polyfill */
    NODE_POLYFILL_PROVIDE: 'node-polyfill-provide',
    /** WebpackSRIPlugin */
    SUBRESOURCE_INTEGRITY: 'subresource-integrity',
    /** WebpackAssetsRetryPlugin */
    ASSETS_RETRY: 'assets-retry',
    /** AutoSetRootFontSizePlugin */
    AUTO_SET_ROOT_SIZE: 'auto-set-root-size',
    /** HtmlAsyncChunkPlugin */
    HTML_ASYNC_CHUNK: 'html-async-chunk',
  },
  /** Predefined minimizers */
  MINIMIZER: {
    /** TerserWebpackPlugin */
    JS: 'js',
    /** CssMinimizerWebpackPlugin */
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
  config,
  context,
  includes,
  excludes,
}: {
  rule: BundlerChainRule;
  config: NormalizedConfig;
  context: Context;
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

  [...includes, ...(config.source.include || [])].forEach((condition) => {
    rule.include.add(condition);
  });

  [...excludes, ...(config.source.exclude || [])].forEach((condition) => {
    rule.exclude.add(condition);
  });
}

export function applyOutputPlugin(api: RsbuildPluginAPI) {
  function getPublicPath({
    config,
    isProd,
    context,
  }: {
    config: NormalizedConfig;
    isProd: boolean;
    context: Context;
  }) {
    const { dev, output } = config;

    let publicPath = DEFAULT_ASSET_PREFIX;

    if (isProd) {
      if (output.assetPrefix) {
        publicPath = output.assetPrefix;
      }
    } else if (typeof dev.assetPrefix === 'string') {
      publicPath = dev.assetPrefix;
    } else if (dev.assetPrefix === true) {
      const protocol = context.devServer?.https ? 'https' : 'http';
      const hostname = context.devServer?.hostname || DEFAULT_DEV_HOST;
      const port = context.devServer?.port || DEFAULT_PORT;
      if (hostname === DEFAULT_DEV_HOST) {
        const localHostname = `localhost`;
        // If user not specify the hostname, it would use 0.0.0.0
        // The http://0.0.0.0:port can't visit in windows, so we shouldn't set publicPath as `//0.0.0.0:${port}/`;
        // Relative to docs:
        // - https://github.com/quarkusio/quarkus/issues/12246
        publicPath = `${protocol}://${localHostname}:${port}/`;
      } else {
        publicPath = `${protocol}://${hostname}:${port}/`;
      }
    }

    return addTrailingSlash(publicPath);
  }

  api.modifyBundlerChain(
    async (chain, { isProd, isServer, isServiceWorker }) => {
      const config = api.getNormalizedConfig();
      const jsPath = getDistPath(config, 'js');

      const publicPath = getPublicPath({
        config,
        isProd,
        context: api.context,
      });

      // js output
      const jsFilename = getFilename(config, 'js', isProd);

      chain.output
        .path(api.context.distPath)
        .filename(posix.join(jsPath, jsFilename))
        .chunkFilename(posix.join(jsPath, `async/${jsFilename}`))
        .publicPath(publicPath)
        // disable pathinfo to improve compile performance
        // the path info is useless in most cases
        // see: https://webpack.js.org/guides/build-performance/#output-without-path-info
        .pathinfo(false)
        // since webpack v5.54.0+, hashFunction supports xxhash64 as a faster algorithm
        // which will be used as default when experiments.futureDefaults is enabled.
        .hashFunction('xxhash64');

      if (isServer) {
        const serverPath = getDistPath(config, 'server');
        const filename = posix.join(serverPath, `[name].js`);

        chain.output
          .filename(filename)
          .chunkFilename(filename)
          .libraryTarget('commonjs2');
      }

      if (isServiceWorker) {
        const workerPath = getDistPath(config, 'worker');
        const filename = posix.join(workerPath, `[name].js`);

        chain.output.filename(filename).chunkFilename(filename);
      }
    },
  );
}

export function applyResolvePlugin(api: RsbuildPluginAPI) {
  api.modifyBundlerChain((chain, { CHAIN_ID }) => {
    const config = api.getNormalizedConfig();

    applyExtensions({ chain });

    applyAlias({
      chain,
      config,
      rootPath: api.context.rootPath,
    });

    applyFullySpecified({ chain, config, CHAIN_ID });
  });
}

// compatible with legacy packages with type="module"
// https://github.com/webpack/webpack/issues/11467
function applyFullySpecified({
  chain,
  CHAIN_ID,
}: {
  chain: BundlerChain;
  config: NormalizedConfig;
  CHAIN_ID: ChainIdentifier;
}) {
  chain.module
    .rule(CHAIN_ID.RULE.MJS)
    .test(/\.m?js/)
    .resolve.set('fullySpecified', false);

  if (chain.module.rules.get(CHAIN_ID.RULE.JS_DATA_URI)) {
    chain.module
      .rule(CHAIN_ID.RULE.JS_DATA_URI)
      .resolve.set('fullySpecified', false);
  }
}

function applyExtensions({ chain }: { chain: BundlerChain }) {
  const extensions = [
    // most projects are using TypeScript, resolve .ts(x) files first to reduce resolve time.
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.mjs',
    '.json',
  ];

  chain.resolve.extensions.merge(extensions);
}

function applyAlias({
  chain,
  config,
  rootPath,
}: {
  chain: BundlerChain;
  config: NormalizedConfig;
  rootPath: string;
}) {
  const { alias } = config.source as {
    alias?: ChainedConfig<Record<string, string>>;
  };

  if (!alias) {
    return;
  }

  const mergedAlias = mergeChainedOptions({
    defaults: {},
    options: alias,
  });

  /**
   * Format alias value:
   * - Relative paths need to be turned into absolute paths.
   * - Absolute paths or a package name are not processed.
   */
  Object.keys(mergedAlias).forEach((name) => {
    const values = castArray(mergedAlias[name]);
    const formattedValues = values.map((value) => {
      if (typeof value === 'string' && value.startsWith('.')) {
        return ensureAbsolutePath(rootPath, value);
      }
      return value;
    });

    chain.resolve.alias.set(
      name,
      formattedValues.length === 1 ? formattedValues[0] : formattedValues,
    );
  });
}
