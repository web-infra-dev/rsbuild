import { posix } from 'node:path';
import { getDistPath, getFilename } from './fs';
import { addTrailingSlash, isPlainObject, removeTailingSlash } from './utils';
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
  BundlerChain,
  RsbuildEntry,
  RspackConfig,
  RsbuildConfig,
  RsbuildTarget,
  RsbuildContext,
  CreateAsyncHook,
  BundlerChainRule,
  NormalizedConfig,
  RsbuildPluginAPI,
  ModifyBundlerChainFn,
  ModifyBundlerChainUtils,
  BuiltinSwcLoaderOptions,
} from './types';
import { mergeChainedOptions } from './mergeChainedOptions';
import type { EntryDescription } from '@rspack/core';

export async function getBundlerChain() {
  const { default: WebpackChain } = await import('../compiled/webpack-chain');

  const bundlerChain = new WebpackChain();

  return bundlerChain as unknown as BundlerChain;
}

export async function modifyBundlerChain(
  context: RsbuildContext & {
    hooks: {
      modifyBundlerChain: CreateAsyncHook<ModifyBundlerChainFn>;
    };
    config: Readonly<RsbuildConfig>;
  },
  utils: ModifyBundlerChainUtils,
): Promise<BundlerChain> {
  debug('modify bundler chain');

  const bundlerChain = await getBundlerChain();

  const [modifiedBundlerChain] = await context.hooks.modifyBundlerChain.call(
    bundlerChain,
    utils,
  );

  if (context.config.tools?.bundlerChain) {
    for (const item of castArray(context.config.tools.bundlerChain)) {
      item(modifiedBundlerChain, utils);
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
    /** Rule for node */
    NODE: 'node',
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
    /** node-loader */
    NODE: 'node',
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
    /** mini-css-extract-plugin.loader */
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
    /** AssetsRetryPlugin */
    ASSETS_RETRY: 'assets-retry',
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
  config,
  context,
  includes,
  excludes,
}: {
  rule: BundlerChainRule;
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

  for (const condition of [...includes, ...(config.source.include || [])]) {
    rule.include.add(condition);
  }

  for (const condition of [...excludes, ...(config.source.exclude || [])]) {
    rule.exclude.add(condition);
  }
}

export const formatPublicPath = (publicPath: string, withSlash = true) => {
  // 'auto' is a magic value in Rspack and we should not add trailing slash
  if (publicPath === 'auto') {
    return publicPath;
  }

  return withSlash
    ? addTrailingSlash(publicPath)
    : removeTailingSlash(publicPath);
};

export const getPublicPathFromChain = (
  chain: BundlerChain,
  withSlash = true,
) => {
  const publicPath = chain.output.get('publicPath');

  if (typeof publicPath === 'string') {
    return formatPublicPath(publicPath, withSlash);
  }

  return formatPublicPath(DEFAULT_ASSET_PREFIX, withSlash);
};

function getPublicPath({
  config,
  isProd,
  context,
}: {
  config: NormalizedConfig;
  isProd: boolean;
  context: RsbuildContext;
}) {
  const { dev, output } = config;

  let publicPath = DEFAULT_ASSET_PREFIX;

  if (isProd) {
    if (typeof output.assetPrefix === 'string') {
      publicPath = output.assetPrefix;
    }
  } else if (typeof dev.assetPrefix === 'string') {
    publicPath = dev.assetPrefix;
  } else if (dev.assetPrefix === true) {
    const protocol = context.devServer?.https ? 'https' : 'http';
    const hostname = context.devServer?.hostname || DEFAULT_DEV_HOST;
    const port = context.devServer?.port || DEFAULT_PORT;
    if (hostname === DEFAULT_DEV_HOST) {
      const localHostname = 'localhost';
      // If user not specify the hostname, it would use 0.0.0.0
      // The http://0.0.0.0:port can't visit in windows, so we shouldn't set publicPath as `//0.0.0.0:${port}/`;
      // Relative to docs:
      // - https://github.com/quarkusio/quarkus/issues/12246
      publicPath = `${protocol}://${localHostname}:${port}/`;
    } else {
      publicPath = `${protocol}://${hostname}:${port}/`;
    }
  }

  return formatPublicPath(publicPath);
}

export function applyOutputPlugin(api: RsbuildPluginAPI) {
  api.modifyBundlerChain(
    async (chain, { isProd, isServer, isServiceWorker }) => {
      const config = api.getNormalizedConfig();

      const publicPath = getPublicPath({
        config,
        isProd,
        context: api.context,
      });

      // js output
      const jsPath = getDistPath(config, 'js');
      const jsAsyncPath = getDistPath(config, 'jsAsync');
      const jsFilename = getFilename(config, 'js', isProd);

      chain.output
        .path(api.context.distPath)
        .filename(posix.join(jsPath, jsFilename))
        .chunkFilename(posix.join(jsAsyncPath, jsFilename))
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

        chain.output
          .path(posix.join(api.context.distPath, serverPath))
          .filename('[name].js')
          .chunkFilename('[name].js')
          .libraryTarget('commonjs2');
      }

      if (isServiceWorker) {
        const workerPath = getDistPath(config, 'worker');
        const filename = posix.join(workerPath, '[name].js');

        chain.output.filename(filename).chunkFilename(filename);
      }
    },
  );
}

export function applyResolvePlugin(api: RsbuildPluginAPI) {
  api.modifyBundlerChain({
    order: 'pre',
    handler: (chain, { target, CHAIN_ID }) => {
      const config = api.getNormalizedConfig();

      applyExtensions({ chain });

      applyAlias({
        chain,
        target,
        config,
        rootPath: api.context.rootPath,
      });

      // in some cases (modern.js), get error when fullySpecified rule after js rule
      applyFullySpecified({ chain, config, CHAIN_ID });
    },
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
  target,
  config,
  rootPath,
}: {
  chain: BundlerChain;
  target: RsbuildTarget;
  config: NormalizedConfig;
  rootPath: string;
}) {
  const { alias } = config.source;

  if (!alias) {
    return;
  }

  const mergedAlias = mergeChainedOptions({
    defaults: {},
    options: alias,
    utils: { target },
  });

  /**
   * Format alias value:
   * - Relative paths need to be turned into absolute paths.
   * - Absolute paths or a package name are not processed.
   */
  for (const name of Object.keys(mergedAlias)) {
    const values = castArray(mergedAlias[name]);
    const formattedValues = values.map((value) => {
      if (typeof value === 'string' && value.startsWith('.')) {
        return ensureAbsolutePath(rootPath, value);
      }
      return value;
    });

    chain.resolve.alias.set(
      name,
      (formattedValues.length === 1 ? formattedValues[0] : formattedValues) as
        | string
        | string[],
    );
  }
}

export function chainToConfig(chain: BundlerChain): RspackConfig {
  const config = chain.toConfig();
  const { entry } = config;

  if (!isPlainObject(entry)) {
    return config as RspackConfig;
  }

  const formattedEntry: RsbuildEntry = {};

  /**
   * webpack-chain can not handle entry description object correctly,
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

export const modifySwcLoaderOptions = ({
  chain,
  modifier,
}: {
  chain: BundlerChain;
  modifier: (config: BuiltinSwcLoaderOptions) => BuiltinSwcLoaderOptions;
}) => {
  const ruleIds = [CHAIN_ID.RULE.JS, CHAIN_ID.RULE.JS_DATA_URI];

  for (const ruleId of ruleIds) {
    if (chain.module.rules.has(ruleId)) {
      const rule = chain.module.rule(ruleId);
      if (rule.uses.has(CHAIN_ID.USE.SWC)) {
        rule.use(CHAIN_ID.USE.SWC).tap(modifier);
      }
    }
  }
};
