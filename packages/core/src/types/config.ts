import type { IncomingMessage, ServerResponse } from 'node:http';
import type { SecureServerSessionOptions } from 'node:http2';
import type { ServerOptions as HttpsServerOptions } from 'node:https';
import type {
  Configuration,
  CopyRspackPluginOptions,
  Externals,
  LightningCssMinimizerRspackPluginOptions,
  ModuleFederationPluginOptions,
  RuleSetCondition,
  SwcJsMinimizerRspackPluginOptions,
  SwcLoaderOptions,
} from '@rspack/core';
import type { ChokidarOptions } from '../../compiled/chokidar/index.js';
import type cors from '../../compiled/cors/index.js';
import type {
  Options as HttpProxyOptions,
  Filter as ProxyFilter,
} from '../../compiled/http-proxy-middleware/index.js';
import type RspackChain from '../../compiled/rspack-chain';
import type { FileDescriptor } from '../../compiled/rspack-manifest-plugin';
import type { BundleAnalyzerPlugin } from '../../compiled/webpack-bundle-analyzer/index.js';
import type {
  ModifyBundlerChainUtils,
  ModifyChainUtils,
  Routes,
} from './hooks';
import type {
  ModifyWebpackChainUtils,
  ModifyWebpackConfigUtils,
  RsbuildPlugins,
} from './plugin';
import type { RsbuildEntry, RsbuildMode, RsbuildTarget } from './rsbuild';
import type { BundlerPluginInstance, Rspack, RspackRule } from './rspack';
import type {
  CSSExtractOptions,
  CSSLoaderModulesOptions,
  CSSLoaderOptions,
  HtmlRspackPlugin,
  PostCSSLoaderOptions,
  PostCSSPlugin,
  StyleLoaderOptions,
  WebpackConfig,
} from './thirdParty';
import type {
  ConfigChain,
  ConfigChainAsyncWithContext,
  ConfigChainMergeContext,
  ConfigChainWithContext,
  DeepReadonly,
  MaybePromise,
  OneOrMany,
} from './utils';

export type ToolsSwcConfig = ConfigChain<SwcLoaderOptions>;

export type ToolsBundlerChainConfig = OneOrMany<
  (chain: RspackChain, utils: ModifyBundlerChainUtils) => MaybePromise<void>
>;

export type ToolsPostCSSLoaderConfig = ConfigChainWithContext<
  PostCSSLoaderOptions,
  { addPlugins: (plugins: PostCSSPlugin | PostCSSPlugin[]) => void }
>;

export type ToolsCSSLoaderConfig = ConfigChain<CSSLoaderOptions>;

export type ToolsStyleLoaderConfig = ConfigChain<StyleLoaderOptions>;

export type ToolsHtmlPluginConfig = ConfigChainWithContext<
  HtmlRspackPlugin.Options,
  {
    entryName: string;
    entryValue: (string | string[] | Rspack.EntryDescription)[];
  }
>;

// equivalent to import('webpack-merge').merge
export type WebpackMerge = <Configuration extends object>(
  firstConfiguration: Configuration | Configuration[],
  ...configurations: Configuration[]
) => Configuration;

export type ModifyRspackConfigUtils = ModifyChainUtils & {
  addRules: (rules: RspackRule | RspackRule[]) => void;
  appendRules: (rules: RspackRule | RspackRule[]) => void;
  prependPlugins: (
    plugins: BundlerPluginInstance | BundlerPluginInstance[],
  ) => void;
  appendPlugins: (
    plugins: BundlerPluginInstance | BundlerPluginInstance[],
  ) => void;
  removePlugin: (pluginName: string) => void;
  mergeConfig: WebpackMerge;
};

export type ToolsRspackConfig = ConfigChainAsyncWithContext<
  Rspack.Configuration,
  ModifyRspackConfigUtils
>;

export type ToolsWebpackConfig = ConfigChainWithContext<
  WebpackConfig,
  ModifyWebpackConfigUtils
>;

export type ToolsWebpackChainConfig = OneOrMany<
  (chain: RspackChain, utils: ModifyWebpackChainUtils) => void
>;

export interface ToolsConfig {
  /**
   * Configure bundler config base on [rspack-chain](https://github.com/rspack-contrib/rspack-chain)
   */
  bundlerChain?: ToolsBundlerChainConfig;
  /**
   * Modify the options of [css-loader](https://github.com/webpack-contrib/css-loader).
   */
  cssLoader?: ToolsCSSLoaderConfig;
  /**
   * Modify the options of [postcss-loader](https://github.com/webpack-contrib/postcss-loader).
   */
  postcss?: ToolsPostCSSLoaderConfig;
  /**
   * Modify the options of [style-loader](https://github.com/webpack-contrib/style-loader).
   */
  styleLoader?: ToolsStyleLoaderConfig;
  /**
   * Configure the html-rspack-plugin.
   */
  htmlPlugin?: boolean | ToolsHtmlPluginConfig;
  /**
   * Configure the `builtin:swc-loader` of Rspack.
   */
  swc?: ToolsSwcConfig;
  /**
   * Configure the `builtin:lightningcss-loader` of Rspack.
   */
  lightningcssLoader?: boolean | ConfigChain<Rspack.LightningcssLoaderOptions>;
  /**
   * Modify the options of [CssExtractRspackPlugin](https://rspack.dev/plugins/rspack/css-extract-rspack-plugin).
   */
  cssExtract?: CSSExtractOptions;
  /**
   * Configure Rspack.
   */
  rspack?: ToolsRspackConfig;
  /**
   * Configure [webpack](https://webpack.js.org/).
   * @requires webpack
   */
  webpack?: ToolsWebpackConfig;
  /**
   * Configure webpack by [rspack-chain](https://github.com/rspack-contrib/rspack-chain).
   * @requires webpack
   */
  webpackChain?: ToolsWebpackChainConfig;
}

export type NormalizedToolsConfig = ToolsConfig & {
  cssExtract: Required<CSSExtractOptions>;
};

export type Alias = Record<string, string | false | (string | false)[]>;

// Use a loose type to compat webpack
export type Define = Record<string, any>;

export type AliasStrategy = 'prefer-tsconfig' | 'prefer-alias';

export type Decorators = {
  /**
   * Specify the version of decorators to use.
   * @default '2022-03'
   */
  version?:
    | 'legacy' // stage 1
    | '2022-03'; // stage 3
};

export interface SourceConfig {
  /**
   * @deprecated Use `resolve.alias` instead.
   * `source.alias` will be removed in v2.0.0.
   */
  alias?: ConfigChain<Alias>;
  /**
   * @deprecated Use `resolve.aliasStrategy` instead.
   * `source.aliasStrategy` will be removed in v2.0.0.
   */
  aliasStrategy?: AliasStrategy;
  /**
   * Include additional files that should be treated as static assets.
   * @default undefined
   */
  assetsInclude?: Rspack.RuleSetCondition;
  /**
   * Specify additional JavaScript files that need to be compiled by SWC.
   * Through the `source.include` config, you can specify directories or modules
   * that need to be compiled by Rsbuild. The usage of `source.include` is
   * consistent with [Rule.include](https://rspack.dev/config/module#ruleinclude)
   * in Rspack, which supports passing in strings or regular expressions to match
   * the module path.
   * @default
   * [
   *   { and: [rootPath, { not: /[\\/]node_modules[\\/]/ }], },
   *   /\.(?:ts|tsx|jsx|mts|cts)$/,
   * ];
   */
  include?: RuleSetCondition[];
  /**
   * Set the entry modules.
   * @default
   * {
   *   // Rsbuild also supports other suffixes by default, such as ts,
   *   // tsx, jsx, mts, cts, mjs, cjs
   *   index: './src/index.js',
   * }
   */
  entry?: RsbuildEntry;
  /**
   * Exclude JavaScript or TypeScript files that do not need to be compiled by SWC.
   */
  exclude?: RuleSetCondition[];
  /**
   * Add a script before the entry file of each page.
   * This script will be executed before the page code.
   * It can be used to execute global logics, such as polyfill injection.
   */
  preEntry?: string | string[];
  /**
   * Used to replaces variables in your code with other values or expressions at compile time.
   */
  define?: Define;
  /**
   * Configuring decorators syntax.
   */
  decorators?: Decorators;
  /**
   * Used to import the code and style of the component library on demand.
   */
  transformImport?:
    | TransformImportFn
    | Array<TransformImport | TransformImportFn>;
  /**
   * Configure a custom tsconfig.json file path to use, can be a relative or absolute path.
   * @default 'tsconfig.json'
   */
  tsconfigPath?: string;
}

export type TransformImport = {
  libraryName: string;
  libraryDirectory?: string;
  style?: string | boolean;
  styleLibraryDirectory?: string;
  camelToDashComponentName?: boolean;
  transformToDefaultImport?: boolean;
  // Use a loose type to compat webpack
  customName?: any;
  // Use a loose type to compat webpack
  customStyleName?: any;
};

type TransformImportFn = (
  imports: TransformImport[],
) => TransformImport[] | void;

export interface NormalizedSourceConfig extends SourceConfig {
  define: Define;
  /**
   * @deprecated Use `resolve.alias` instead.
   * `source.alias` will be removed in v2.0.0.
   */
  alias: ConfigChain<Alias>;
  preEntry: string[];
  decorators: Required<Decorators>;
}

export type HtmlFallback = false | 'index';

export type ProxyBypass = (
  req: IncomingMessage,
  res: ServerResponse,
  proxyOptions: ProxyOptions,
) => MaybePromise<string | undefined | null | boolean>;

export type { ProxyFilter };

export type ProxyOptions = HttpProxyOptions & {
  /**
   * Bypass the proxy based on the return value of a function.
   * - Return `null` or `undefined` to continue processing the request with proxy.
   * - Return `true` to continue processing the request without proxy.
   * - Return `false` to produce a 404 error for the request.
   * - Return a path to serve from, instead of continuing to proxy the request.
   * - Return a Promise to handle the request asynchronously.
   */
  bypass?: ProxyBypass;
  /**
   * Used to proxy multiple specified paths to the same target.
   */
  context?: ProxyFilter;
};

export type ProxyConfig =
  | Record<string, string>
  | Record<string, ProxyOptions>
  | ProxyOptions[]
  | ProxyOptions;

export type HistoryApiFallbackContext = {
  match: RegExpMatchArray;
  parsedUrl: import('node:url').Url;
  request: Request;
};

export type HistoryApiFallbackOptions = {
  index?: string;
  verbose?: boolean;
  logger?: typeof console.log;
  htmlAcceptHeaders?: string[];
  disableDotRule?: true;
  rewrites?: Array<{
    from: RegExp;
    to: string | RegExp | ((context: HistoryApiFallbackContext) => string);
  }>;
};

export type PrintUrls =
  | boolean
  | ((params: {
      urls: string[];
      port: number;
      routes: Routes;
      protocol: string;
    }) => string[] | void);

export type PublicDirOptions = {
  /**
   * The name of the public directory, can be set as a relative path or an absolute path.
   * @default 'public'
   */
  name?: string;
  /**
   * Whether to copy files from the public directory to the dist directory on production build.
   * - `true`: copy files
   * - `false`: do not copy files
   * - `'auto'`: if `output.target` is not `'node'`, copy files, otherwise do not copy
   * @default 'auto'
   */
  copyOnBuild?: boolean | 'auto';
  /**
   * whether to watch the public directory and reload the page when the files change
   * @default false
   */
  watch?: boolean;
};

export type PublicDir = false | PublicDirOptions | PublicDirOptions[];

export interface ServerConfig {
  /**
   * Configure the base path of the server.
   * @default '/'
   */
  base?: string;
  /**
   * Whether to enable gzip compression for served static assets.
   * @default true
   */
  compress?: boolean;
  /**
   * Serving static files from the directory (by default 'public' directory)
   */
  publicDir?: PublicDir;
  /**
   * Specify a port number for Rsbuild server to listen.
   * @default 3000
   */
  port?: number;
  /**
   * Configure HTTPS options to enable HTTPS server.
   * When enabled, HTTP server will be disabled.
   * @default undefined
   */
  https?: HttpsServerOptions | SecureServerSessionOptions;
  /**
   * Specify the host that the Rsbuild server listens to.
   * @default '0.0.0.0'
   */
  host?: string;
  /**
   * Adds headers to all responses.
   */
  headers?: Record<string, string | string[]>;
  /**
   * Whether to enable HTML fallback.
   * @default 'index'
   */
  htmlFallback?: HtmlFallback;
  /**
   * Provide alternative pages for some 404 responses or other requests.
   * see https://github.com/bripkens/connect-history-api-fallback
   */
  historyApiFallback?: boolean | HistoryApiFallbackOptions;
  /**
   * Set the page URL to open when the server starts.
   * @default false
   */
  open?:
    | boolean
    | string
    | string[]
    | {
        target?: string | string[];
        before?: () => Promise<void> | void;
      };
  /**
   * Configure CORS for the dev server or preview server.
   * - object: enable CORS with the specified options.
   * - true: enable CORS with default options (allow all origins, not recommended).
   * - false: disable CORS.
   * @default false
   * @link https://github.com/expressjs/cors
   */
  cors?: boolean | cors.CorsOptions;
  /**
   * Configure proxy rules for the dev server or preview server to proxy requests to
   * the specified service.
   */
  proxy?: ProxyConfig;
  /**
   * Whether to throw an error when the port is occupied.
   * @default false
   */
  strictPort?: boolean;
  /**
   * Controls whether and how server URLs are printed when the server starts.
   * @default true
   */
  printUrls?: PrintUrls;
  /**
   * Whether to create Rsbuild's server in middleware mode, which is useful for
   * integrating with other servers.
   * @default false
   */
  middlewareMode?: boolean;
}

export type NormalizedServerConfig = ServerConfig &
  Required<
    Pick<
      ServerConfig,
      | 'htmlFallback'
      | 'port'
      | 'host'
      | 'compress'
      | 'strictPort'
      | 'printUrls'
      | 'open'
      | 'base'
      | 'cors'
      | 'middlewareMode'
    >
  >;

export type SriAlgorithm = 'sha256' | 'sha384' | 'sha512';

export type SriOptions = {
  /**
   * Specifies the algorithm used to compute the integrity hash.
   * @default 'sha384'
   */
  algorithm?: SriAlgorithm;
  /**
   * Whether to enable SRI.
   * `'auto'` means it's enabled in production mode and disabled in development mode.
   * @default false
   */
  enable?: boolean | 'auto';
};

export interface SecurityConfig {
  /**
   * Adding an nonce attribute to sub-resources introduced by HTML allows the browser to
   * verify the nonce of the introduced resource, thus preventing xss.
   */
  nonce?: string;
  /**
   * Adding an integrity attribute (`integrity`) to sub-resources introduced by HTML
   * allows the browser to verify the integrity of the introduced resource, thus preventing
   * tampering with the downloaded resource.
   */
  sri?: SriOptions;
}

export type NormalizedSecurityConfig = Required<SecurityConfig>;

export type ConsoleType = 'log' | 'info' | 'warn' | 'error' | 'table' | 'group';

export type BuildCacheOptions = {
  /**
   * The output directory of the cache files.
   * @default 'node_modules/.cache'
   */
  cacheDirectory?: string;
  /**
   * Add additional cache digests, the previous build cache will be invalidated
   * when any value in the array changes.
   * @default undefined
   */
  cacheDigest?: Array<string | undefined>;
  /**
   * An array of files containing build dependencies.
   * Rspack will use the hash of each of these files to invalidate the persistent cache.
   */
  buildDependencies?: string[];
};

export type PrintFileSizeAsset = {
  /**
   * The name of the asset.
   * @example 'index.html', 'static/js/index.[hash].js'
   */
  name: string;
  /**
   * The size of the asset in bytes.
   */
  size: number;
};

export type PrintFileSizeOptions = {
  /**
   * Whether to print the total size of all static assets.
   * @default true
   */
  total?: boolean;
  /**
   * Whether to print the size of each static asset.
   * @default true
   */
  detail?: boolean;
  /**
   * Whether to print the gzip-compressed size of each static asset.
   * Disable this option can save some gzip computation time for large projects.
   * @default true
   */
  compressed?: boolean;
  /**
   * A filter function to determine which static assets to print.
   * If returned `false`, the static asset will be excluded and not included in the
   * total size or detailed size.
   * @default undefined
   */
  include?: (asset: PrintFileSizeAsset) => boolean;
  /**
   * A filter function to exclude static assets from the total size or detailed size.
   * If both `include` and `exclude` are set, `exclude` will take precedence.
   * @default (asset) => /\.(?:map|LICENSE\.txt)$/.test(asset.name)
   */
  exclude?: (asset: PrintFileSizeAsset) => boolean;
};

export interface PreconnectOption {
  /**
   * The URL of the resource to preconnect to.
   */
  href: string;
  /**
   * Whether to add `crossorigin` attribute to the `<link>` element.
   */
  crossorigin?: boolean;
}

export type Preconnect = Array<string | PreconnectOption>;

export type DnsPrefetch = string[];

export type ResourceHintsIncludeType =
  | 'async-chunks'
  | 'initial'
  | 'all-assets'
  | 'all-chunks';

export type ResourceHintsFilterFn = (filename: string) => boolean;

export type ResourceHintsFilter = OneOrMany<
  string | RegExp | ResourceHintsFilterFn
>;

export interface ResourceHintsOptions {
  /**
   * Specifies which types of resources will be included.
   * - `async-chunks`: Includes all async resources on the current page, such as async JS
   * chunks, and its associated CSS, images, fonts, and other static resources.
   * - `initial`: Includes all non-async resources on the current page.
   * - `all-chunks`: Includes all async and non-async resources on the current page.
   * - `all-assets`: Includes all resources from all pages.
   * @default 'async-chunks'
   */
  type?: ResourceHintsIncludeType;
  /**
   * A extra filter to determine which resources to include.
   */
  include?: ResourceHintsFilter;
  /**
   * A extra filter to determine which resources to exclude.
   */
  exclude?: ResourceHintsFilter;
  /**
   * Whether to dedupe script resources that already exist in the current HTML content.
   * By default, if a resource has been added to the current HTML via a script tag, it will
   * not be preloaded additionally.
   * @default true
   */
  dedupe?: boolean;
}

export type PreloadOptions = ResourceHintsOptions;

export type PrefetchOptions = Omit<ResourceHintsOptions, 'dedupe'>;

export interface PerformanceConfig {
  /**
   * Whether to remove `console.[methodName]` in production build.
   */
  removeConsole?: boolean | ConsoleType[];

  /**
   * Whether to remove the locales of [moment.js](https://momentjs.com/).
   */
  removeMomentLocale?: boolean;

  /**
   * To enable or configure persistent build cache.
   * @experimental This feature is experimental and may be changed in the future.
   */
  buildCache?: BuildCacheOptions | boolean;

  /**
   * Whether to print the file sizes after production build.
   */
  printFileSize?: PrintFileSizeOptions | boolean;

  /**
   * Configure the chunk splitting strategy.
   */
  chunkSplit?: ChunkSplit;

  /**
   * Analyze the size of output files.
   */
  bundleAnalyze?: BundleAnalyzerPlugin.Options;

  /**
   * Used to control resource `Preconnect`.
   *
   * Specifies that the user agent should preemptively connect to the target resource's origin.
   */
  preconnect?: Preconnect;

  /**
   * Used to control resource `DnsPrefetch`.
   *
   * Specifies that the user agent should preemptively perform DNS resolution for the target
   * resource's origin.
   */
  dnsPrefetch?: DnsPrefetch;

  /**
   * Inject the `<link rel="preload">` tags for the static assets generated by Rsbuild.
   *
   * `performance.preload` can be set to an object to specify the options.
   *
   * When `performance.preload` is set to `true`, Rsbuild will use the following default
   * options to preload resources. This means preloading all async resources on the current
   * page, including async JS and its associated CSS, image, font, and other resources.
   *
   * ```js
   * const defaultOptions = {
   *   type: 'async-chunks',
   * };
   * ```
   */
  preload?: true | PreloadOptions;

  /**
   * Inject the `<link rel="prefetch">` tags for the static assets generated by Rsbuild.
   *
   * `performance.prefetch` can be set to an object to specify the options.
   *
   * When `performance.prefetch` is set to `true`, Rsbuild will use the following default
   * options to prefetch resources. This means prefetching all async resources on the current
   * page, including async JS and its associated CSS, image, font, and other resources.
   *
   * ```js
   * const defaultOptions = {
   *   type: 'async-chunks',
   * };
   * ```
   */
  prefetch?: true | PrefetchOptions;

  /**
   * Whether capture timing information for each module,
   * same as the [profile](https://rspack.dev/config/other-options#profile) config of Rspack.
   */
  profile?: boolean;
}

export interface NormalizedPerformanceConfig extends PerformanceConfig {
  printFileSize: PrintFileSizeOptions | boolean;
  chunkSplit: ChunkSplit;
}

export type SplitChunks = Configuration extends {
  optimization?: {
    splitChunks?: infer P;
  };
}
  ? P
  : never;

export type ForceSplitting = RegExp[] | Record<string, RegExp>;

export interface BaseSplitRules {
  strategy?: string;
  forceSplitting?: ForceSplitting;
  override?: SplitChunks;
}

export interface BaseChunkSplit extends BaseSplitRules {
  strategy?:
    | 'split-by-module'
    | 'split-by-experience'
    | 'all-in-one'
    | 'single-vendor';
}

export interface SplitBySize extends BaseSplitRules {
  strategy: 'split-by-size';
  minSize?: number;
  maxSize?: number;
}

export interface SplitCustom extends BaseSplitRules {
  strategy: 'custom';
  splitChunks?: SplitChunks;
}

export type ChunkSplit = BaseChunkSplit | SplitBySize | SplitCustom;

export type DistPathConfig = {
  /**
   * The root directory of all files.
   * @default 'dist'
   **/
  root?: string;
  /**
   * The output directory of JavaScript files.
   * @default 'static/js'
   */
  js?: string;
  /**
   * The output directory of async JavaScript files.
   * @default 'static/js/async'
   */
  jsAsync?: string;
  /**
   * The output directory of CSS files.
   * @default 'static/css'
   */
  css?: string;
  /**
   * The output directory of async CSS files.
   * @default 'static/css/async'
   */
  cssAsync?: string;
  /**
   * The output directory of SVG images.
   * @default 'static/svg'
   */
  svg?: string;
  /**
   * The output directory of font files.
   * @default 'static/font'
   */
  font?: string;
  /**
   * The output directory of HTML files.
   * @default '/'
   */
  html?: string;
  /**
   * The output directory of Wasm files.
   * @default 'static/wasm'
   */
  wasm?: string;
  /**
   * The output directory of non-SVG images.
   * @default 'static/image'
   */
  image?: string;
  /**
   * The output directory of media resources, such as videos.
   * @default 'static/media'
   */
  media?: string;
  /**
   * The output directory of assets, except for above (image, svg, font, html, wasm...)
   * @default 'static/assets'
   */
  assets?: string;
};

export type FilenameConfig = {
  /**
   * The name of HTML files.
   * @default `[name].html`
   */
  html?: string;
  /**
   * The name of the JavaScript files.
   * @default
   * - dev: '[name].js'
   * - prod: '[name].[contenthash:8].js'
   */
  js?: Rspack.Filename;
  /**
   * The name of the CSS files.
   * @default
   * - dev: '[name].css'
   * - prod: '[name].[contenthash:8].css'
   */
  css?: Rspack.CssFilename;
  /**
   * The name of the SVG images.
   * @default '[name].[contenthash:8].svg'
   */
  svg?: Rspack.AssetModuleFilename;
  /**
   * The name of the font files.
   * @default '[name].[contenthash:8][ext]'
   */
  font?: Rspack.AssetModuleFilename;
  /**
   * The name of non-SVG images.
   * @default '[name].[contenthash:8][ext]'
   */
  image?: Rspack.AssetModuleFilename;
  /**
   * The name of media assets, such as video.
   * @default '[name].[contenthash:8][ext]'
   */
  media?: Rspack.AssetModuleFilename;
  /**
   * the name of other assets, except for above (image, svg, font, html, wasm...)
   * @default '[name].[contenthash:8][ext]'
   */
  assets?: Rspack.AssetModuleFilename;
};

export type DataUriLimit = {
  /**
   * The data URI limit of the SVG image.
   * @default 4096
   */
  svg?: number;
  /**
   * The data URI limit of the font file.
   * @default 4096
   */
  font?: number;
  /**
   * The data URI limit of non-SVG images.
   * @default 4096
   */
  image?: number;
  /**
   * The data URI limit of media resources such as videos.
   * @default 4096
   */
  media?: number;
  /**
   * The data URI limit of other static assets.
   * @default 4096
   */
  assets?: number;
};

export type Charset = 'ascii' | 'utf8';

export type LegalComments = 'none' | 'inline' | 'linked';

export type NormalizedDataUriLimit = Required<DataUriLimit>;

export type Polyfill = 'usage' | 'entry' | 'off';

export type SourceMap = {
  /**
   * The source map type for JavaScript files.
   * @default isDev ? 'cheap-module-source-map' : false
   */
  js?: Rspack.Configuration['devtool'];
  /**
   * Whether to generate source map for CSS files.
   * @default false
   */
  css?: boolean;
};

export type CSSModulesLocalsConvention =
  | 'asIs'
  | 'camelCase'
  | 'camelCaseOnly'
  | 'dashes'
  | 'dashesOnly';

export type CSSModules = {
  /**
   * Allows CSS Modules to be automatically enabled based on their filenames.
   * @default true
   */
  auto?: CSSLoaderModulesOptions['auto'];
  /**
   * Allows exporting names from global class names, so you can use them via import.
   * @default false
   */
  exportGlobals?: boolean;
  /**
   * Style of exported class names.
   * @default 'camelCase'
   */
  exportLocalsConvention?: CSSModulesLocalsConvention;
  /**
   * Set the local ident name of CSS Modules.
   * @default isProd ? '[local]-[hash:base64:6]' : '[path][name]__[local]-[hash:base64:6]'
   */
  localIdentName?: string;
  /**
   * Controls the level of compilation applied to the input styles.
   * @default 'local'
   */
  mode?: CSSLoaderModulesOptions['mode'];
  /**
   * Whether to enable ES modules named export for locals.
   * @default false
   */
  namedExport?: boolean;
};

export type Minify =
  | boolean
  | {
      /**
       * Whether to enable JavaScript minification.
       */
      js?: boolean;
      /**
       * Minimizer options of JavaScript, which will be passed to SWC.
       */
      jsOptions?: SwcJsMinimizerRspackPluginOptions;
      /**
       * Whether to enable CSS minimization.
       */
      css?: boolean;
      /**
       * Minimizer options of CSS, which will be passed to LightningCSS.
       */
      cssOptions?: LightningCssMinimizerRspackPluginOptions;
    };

export type InlineChunkTestFunction = (params: {
  size: number;
  name: string;
}) => boolean;

export type InlineChunkTest = RegExp | InlineChunkTestFunction;

export type InlineChunkConfig =
  | boolean
  | InlineChunkTest
  | { enable?: boolean | 'auto'; test: InlineChunkTest };

export type ManifestByEntry = {
  initial?: {
    js?: string[];
    css?: string[];
  };
  async?: {
    js?: string[];
    css?: string[];
  };
  /** other assets (e.g. png、svg、source map) related to the current entry */
  assets?: string[];
  html?: string[];
};

export type ManifestData = {
  entries: {
    /** relate to Rsbuild's source.entry config */
    [entryName: string]: ManifestByEntry;
  };
  /** Flatten all assets */
  allFiles: string[];
};

export type ManifestObjectConfig = {
  /**
   * The filename or path of the manifest file.
   * The manifest file will be emitted to the output directory.
   * @default 'manifest.json'
   */
  filename?: string;
  /**
   * A custom function to generate the content of the manifest file.
   */
  generate?: (params: {
    files: FileDescriptor[];
    manifestData: ManifestData;
  }) => Record<string, unknown>;
  /**
   * Allows you to filter the files included in the manifest.
   * The function receives a `file` parameter and returns `true` to keep the file,
   * or `false` to exclude it.
   * @default (file: FileDescriptor) => !file.name.endsWith('.LICENSE.txt')
   */
  filter?: (file: FileDescriptor) => boolean;
};

export type ManifestConfig = string | boolean | ManifestObjectConfig;

export type CleanDistPathObject = {
  /**
   * Whether to clean up all files under the output directory before the build starts.
   * @default 'auto'
   */
  enable?: boolean | 'auto';
  /**
   * Specify the files to keep in the output directory.
   * If the file's absolute path matches the regular expression in `keep`, the file
   * will not be removed.
   * @default undefined
   */
  keep?: RegExp[];
};

export type CleanDistPath = boolean | 'auto' | CleanDistPathObject;

export interface OutputConfig {
  /**
   * Specify build target to run in specified environment.
   * @default 'web'
   */
  target?: RsbuildTarget;
  /**
   * At build time, prevent some `import` dependencies from being packed into bundles in
   * your code, and instead fetch them externally at runtime.
   * For more information, please see: [Rspack Externals](https://rspack.dev/config/externals)
   * @default undefined
   */
  externals?: Externals;
  /**
   * Set the directory of the output files.
   * Rsbuild will emit files to the specified subdirectory according to the file type.
   */
  distPath?: DistPathConfig;
  /**
   * Sets the filename of output files.
   */
  filename?: FilenameConfig;
  /**
   * Specify the character encoding format for output files.
   * Can be `ascii` or `utf8`.
   * @default 'utf8'
   */
  charset?: Charset;
  /**
   * Configure how the polyfill is injected.
   * @default 'off'
   */
  polyfill?: Polyfill;
  /**
   * When using CDN in the production,
   * you can use this option to set the URL prefix of static assets,
   * similar to the `output.publicPath` config of Rspack.
   * @default `server.base`
   */
  assetPrefix?: string;
  /**
   * Set the size threshold to inline static assets such as images and fonts.
   * By default, static assets will be Base64 encoded and inline into the page if
   * the size is less than 4KiB.
   */
  dataUriLimit?: number | DataUriLimit;
  /**
   * Configure how to handle the legal comment.
   * A "legal comment" is considered to be any statement-level comment in JS or rule-level
   * comment in CSS that contains @license or @preserve or that starts with //! or /\*!.
   * These comments are preserved in output files by default since that follows the intent
   * of the original authors of the code.
   * @default 'linked'
   */
  legalComments?: LegalComments;
  /**
   * Whether to clean up all files under the output directory before the build starts.
   * @default 'auto'
   */
  cleanDistPath?: CleanDistPath;
  /**
   * Allow to custom CSS Modules options.
   */
  cssModules?: CSSModules;
  /**
   * Whether to disable code minification in production build.
   * @default true
   */
  minify?: Minify;
  /**
   * Configure how to generate the manifest file.
   * - `true`: Generate a manifest file named `manifest.json` in the output directory.
   * - `false`: Do not generate the manifest file.
   * - `string`: Generate a manifest file with the specified filename or path.
   * - `object`: Generate a manifest file with the specified options.
   * @default false
   */
  manifest?: ManifestConfig;
  /**
   * Whether to generate source map files, and which format of source map to generate.
   *
   * @default
   * ```js
   * const defaultSourceMap = {
   *   js: isDev ? 'cheap-module-source-map' : false,
   *   css: false,
   * };
   * ```
   */
  sourceMap?: boolean | SourceMap;
  /**
   * Whether to add filename hash after production build.
   * @default true
   */
  filenameHash?: boolean | string;
  /**
   * Whether to inline output scripts files (.js files) into HTML with `<script>` tags.
   * @default false
   */
  inlineScripts?: InlineChunkConfig;
  /**
   * Whether to inline output style files (.css files) into html with `<style>` tags.
   * @default false
   */
  inlineStyles?: InlineChunkConfig;
  /**
   * Whether to inject styles into the DOM via `style-loader`.
   * @default false
   */
  injectStyles?: boolean;
  /**
   * Specifies the range of target browsers that the project is compatible with.
   * This value will be used by [SWC](https://github.com/swc-project/swc) and
   * [Lightning CSS](https://github.com/parcel-bundler/lightningcss) to identify
   * the JavaScript syntax that need to be transformed and the CSS browser prefixes
   * that need to be added.
   * @default undefined
   */
  overrideBrowserslist?: string[];
  /**
   * Copies the specified file or directory to the dist directory.
   * @default undefined
   */
  copy?: CopyRspackPluginOptions | CopyRspackPluginOptions['patterns'];
  /**
   * Whether to emit static assets such as image, font, etc.
   * Return `false` to avoid outputting unnecessary assets for some scenarios such as SSR.
   * @default true
   */
  emitAssets?: boolean;
  /**
   * Whether to emit CSS to the output bundles.
   * If `false`, the CSS will not be extracted to separate files or injected into the
   * JavaScript bundles via `output.injectStyles`.
   * @default `true` when `output.target` is `web`, otherwise `false`
   */
  emitCss?: boolean;
}

export interface NormalizedOutputConfig extends OutputConfig {
  target: RsbuildTarget;
  filename: FilenameConfig;
  distPath: Omit<Required<DistPathConfig>, 'jsAsync' | 'cssAsync' | 'js'> &
    Pick<DistPathConfig, 'jsAsync' | 'cssAsync' | 'js'>;
  polyfill: Polyfill;
  sourceMap:
    | boolean
    | {
        js?: Rspack.Configuration['devtool'];
        css: boolean;
      };
  cleanDistPath: CleanDistPath;
  filenameHash: boolean | string;
  assetPrefix: string;
  dataUriLimit: number | NormalizedDataUriLimit;
  manifest: ManifestConfig;
  minify: Minify;
  inlineScripts: InlineChunkConfig;
  inlineStyles: InlineChunkConfig;
  injectStyles: boolean;
  cssModules: {
    auto: CSSModules['auto'];
    namedExport: boolean;
    exportGlobals: boolean;
    exportLocalsConvention: CSSModulesLocalsConvention;
    localIdentName?: string;
    mode?: CSSModules['mode'];
  };
  emitAssets: boolean;
}

export type CrossOrigin = 'anonymous' | 'use-credentials';

export type ScriptInject = boolean | 'body' | 'head';

export type ScriptLoading = 'defer' | 'module' | 'blocking';

export type OutputStructure = 'flat' | 'nested';

/**
 * custom properties
 * e.g. { name: 'viewport' content: 'width=500, initial-scale=1' }
 * */
export type MetaAttrs = { [attrName: string]: string | boolean };

export type MetaOptions = {
  /**
   * name content pair
   * e.g. { viewport: 'width=device-width, initial-scale=1, shrink-to-fit=no' }`
   * */
  [name: string]: string | false | MetaAttrs;
};

export type HtmlBasicTag = {
  tag: string;
  attrs?: Record<string, string | boolean | null | undefined>;
  children?: string;
};

export type HtmlTag = HtmlBasicTag & {
  hash?: boolean | string | ((url: string, hash: string) => string);
  publicPath?: boolean | string | ((url: string, publicPath: string) => string);
  append?: boolean;
  head?: boolean;
};

export type HtmlTagContext = {
  hash: string;
  entryName: string;
  outputName: string;
  publicPath: string;
};

export type HtmlTagHandler = (
  tags: HtmlTag[],
  context: HtmlTagContext,
) => HtmlTag[] | void;

export type HtmlTagDescriptor = HtmlTag | HtmlTagHandler;

type ChainedHtmlOption<O> = ConfigChainMergeContext<O, { entryName: string }>;

export type AppIconItem = {
  /**
   * The path to the icon, can be a URL, an absolute file path,
   * or a relative path to the project root.
   */
  src: string;
  /**
   * The size of the icon.
   */
  size: number;
  /**
   * Specifies the intended target for which the icon should be generated.
   * - `apple-touch-icon` for iOS system.
   * - `web-app-manifest` for web application manifest.
   */
  target?: 'apple-touch-icon' | 'web-app-manifest';
};

export type AppIcon = {
  /**
   * The name of the application.
   * @see https://developer.mozilla.org/en-US/docs/Web/Manifest/name
   */
  name?: string;
  /**
   * The list of icons.
   */
  icons: AppIconItem[];
  /**
   * The filename of the manifest file.
   * @default 'manifest.webmanifest'
   */
  filename?: string;
};

export interface HtmlConfig {
  /**
   * Configure the `<meta>` tag of the HTML.
   *
   * @default
   * ```js
   * const defaultMeta = {
   *   charset: { charset: 'UTF-8' },
   *   viewport: 'width=device-width, initial-scale=1.0',
   * };
   * ```
   */
  meta?: ChainedHtmlOption<MetaOptions>;
  /**
   * Set the title tag of the HTML page.
   * @default 'Rsbuild App'
   */
  title?: ChainedHtmlOption<string>;
  /**
   * Set the inject position of the `<script>` tag.
   * @default 'head'
   */
  inject?: ChainedHtmlOption<ScriptInject>;
  /**
   * Inject custom html tags into the output html files.
   * @default undefined
   */
  tags?: OneOrMany<HtmlTagDescriptor>;
  /**
   * Set the favicon icon for all pages.
   * @default undefined
   */
  favicon?: ChainedHtmlOption<string>;
  /**
   * Set the web application icons to display when added to the home screen of a mobile device.
   *
   * @default undefined
   * @example
   * appIcon: {
   *   name: 'My Website',
   *   icons: [
   *     { src: './icon-192.png', size: 192 },
   *     { src: './icon-512.png', size: 512 },
   *   ]
   * }
   */
  appIcon?: AppIcon;
  /**
   * Set the id of root element.
   * @default 'root'
   */
  mountId?: string;
  /**
   * Set the [crossorigin](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin) attribute
   * of the `<script>` tag.
   * @default false
   */
  crossorigin?: boolean | CrossOrigin;
  /**
   * Define the directory structure of the HTML output files.
   * @default 'flat'
   */
  outputStructure?: OutputStructure;
  /**
   * Define the path to the HTML template,
   * corresponding to the `template` config of [html-rspack-plugin](https://github.com/rspack-contrib/html-rspack-plugin).
   * @default A built-in HTML template
   */
  template?: ChainedHtmlOption<string>;
  /**
   * Define the parameters in the HTML template,
   * corresponding to the `templateParameters` config of [html-rspack-plugin](https://github.com/rspack-contrib/html-rspack-plugin).
   */
  templateParameters?: ConfigChainWithContext<
    Record<string, unknown>,
    { entryName: string }
  >;
  /**
   * Set the loading mode of the `<script>` tag.
   * @default 'defer'
   */
  scriptLoading?: ScriptLoading;
}

export type NormalizedHtmlConfig = HtmlConfig & {
  meta: ChainedHtmlOption<MetaOptions>;
  title: ChainedHtmlOption<string>;
  mountId: string;
  inject: ChainedHtmlOption<ScriptInject>;
  crossorigin: boolean | CrossOrigin;
  outputStructure: OutputStructure;
  scriptLoading: ScriptLoading;
};

export type ProgressBarConfig = {
  id?: string;
};

export type NextFunction = () => void;

export type RequestHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  next: NextFunction,
) => void;

export type EnvironmentAPI = {
  [name: string]: {
    /**
     * Get stats info about current environment.
     */
    getStats: () => Promise<Rspack.Stats>;

    /**
     * Load and execute stats bundle in Server.
     *
     * @param entryName - relate to rsbuild source.entry
     * @returns the return of entry module.
     */
    loadBundle: <T = unknown>(entryName: string) => Promise<T>;

    /**
     * Get the compiled HTML template.
     */
    getTransformedHtml: (entryName: string) => Promise<string>;
  };
};

export type SetupMiddlewaresServer = {
  sockWrite: (
    type: string,
    data?: string | boolean | Record<string, any>,
  ) => void;
  environments: EnvironmentAPI;
};

export type SetupMiddlewaresFn = (
  middlewares: {
    unshift: (...handlers: RequestHandler[]) => void;
    push: (...handlers: RequestHandler[]) => void;
  },
  server: SetupMiddlewaresServer,
) => void;

export type ClientConfig = {
  /**
   * The path for the WebSocket request.
   * @default '/rsbuild-hmr'
   */
  path?: string;
  /**
   * The port number for the WebSocket request.
   * @default location.port
   */
  port?: string | number;
  /**
   * The host for the WebSocket request.
   * @default location.hostname
   */
  host?: string;
  /**
   * The protocol name for the WebSocket request.
   * @default location.protocol === 'https:' ? 'wss' : 'ws'
   */
  protocol?: 'ws' | 'wss';
  /**
   * The maximum number of reconnection attempts after a WebSocket request is disconnected.
   * @default 100
   */
  reconnect?: number;
  /**
   * Whether to display an error overlay in the browser when a compilation error occurs.
   * @default true
   */
  overlay?: boolean;
};

export type NormalizedClientConfig = Pick<ClientConfig, 'protocol'> &
  Omit<Required<ClientConfig>, 'protocol'>;

export type { ChokidarOptions };

export type WatchFiles = {
  paths: string | string[];
  options?: ChokidarOptions;
  type?: 'reload-page' | 'reload-server';
};

export type CliShortcut = {
  /**
   * The key to trigger the shortcut.
   */
  key: string;
  /**
   * The description of the shortcut.
   */
  description: string;
  /**
   * The action to execute when the shortcut is triggered.
   */
  action: () => void | Promise<void>;
};

export interface DevConfig {
  /**
   * Whether to enable Hot Module Replacement.
   */
  hmr?: boolean;
  /**
   * Whether to reload the page when file changes are detected.
   */
  liveReload?: boolean;
  /**
   * Set the URL prefix of static assets in development mode,
   * similar to the [output.publicPath](https://rspack.dev/config/output#outputpublicpath)
   * config of Rspack.
   */
  assetPrefix?: string | boolean;
  /**
   * Whether to display progress bar during compilation.
   */
  progressBar?: boolean | ProgressBarConfig;
  /**
   * Config for Rsbuild client code.
   */
  client?: ClientConfig;
  /**
   * Whether to enable CLI shortcuts.
   */
  cliShortcuts?:
    | boolean
    | {
        /**
         * Customize the CLI shortcuts.
         * @param shortcuts - The default CLI shortcuts.
         * @returns - The customized CLI shortcuts.
         */
        custom?: (shortcuts: CliShortcut[]) => CliShortcut[];
        /**
         * Whether to print the help hint when the server is started.
         * @default true
         */
        help?: boolean;
      };
  /**
   * Provides the ability to execute a custom function and apply custom middlewares.
   */
  setupMiddlewares?: SetupMiddlewaresFn[];
  /**
   * Controls whether the build output from development mode is written to disk.
   * @default false
   */
  writeToDisk?: boolean | ((filename: string) => boolean);
  /**
   * This option allows you to configure a list of globs/directories/files to watch for
   * file changes.
   */
  watchFiles?: WatchFiles | WatchFiles[];
  /**
   * Enable lazy compilation.
   * @default false
   */
  lazyCompilation?: boolean | Rspack.LazyCompilationOptions;
}

export type NormalizedDevConfig = DevConfig &
  Required<
    Pick<
      DevConfig,
      'hmr' | 'liveReload' | 'assetPrefix' | 'writeToDisk' | 'cliShortcuts'
    >
  > & {
    client: NormalizedClientConfig;
  };

export interface ResolveConfig {
  /**
   * Force Rsbuild to resolve the specified packages from project root,
   * which is useful for deduplicating packages and reducing the bundle size.
   */
  dedupe?: string[];
  /**
   * Set the alias for the module path, which is used to simplify the import path or
   * redirect the module reference.
   * Similar to the [resolve.alias](https://rspack.dev/config/resolve) config of Rspack.
   */
  alias?: ConfigChain<Alias>;
  /**
   * Set the strategy for path alias resolution, to control the priority relationship
   * between the `paths` option in `tsconfig.json` and the `resolve.alias` option of Rsbuild.
   * @default 'prefer-tsconfig'
   */
  aliasStrategy?: AliasStrategy;
  /**
   * Automatically resolve file extensions when importing modules.
   * This means you can import files without explicitly writing their extensions.
   * @default ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json']
   */
  extensions?: string[];
}

export type NormalizedResolveConfig = ResolveConfig &
  Pick<Required<ResolveConfig>, 'alias' | 'aliasStrategy' | 'extensions'>;

export type ModuleFederationConfig = {
  options: ModuleFederationPluginOptions;
};

export type NormalizedModuleFederationConfig = ModuleFederationConfig;

export type RsbuildConfigMeta = {
  /**
   * Path to the rsbuild config file.
   */
  configFilePath: string;
};

/**
 * The Rsbuild config to run in the specified environment.
 * */
export interface EnvironmentConfig {
  /**
   * Options for local development.
   */
  dev?: Pick<
    DevConfig,
    'hmr' | 'assetPrefix' | 'progressBar' | 'lazyCompilation' | 'writeToDisk'
  >;
  /**
   * Options for HTML generation.
   */
  html?: HtmlConfig;
  /**
   * Options for the low-level tools.
   */
  tools?: ToolsConfig;
  /**
   * Options for module resolution.
   */
  resolve?: ResolveConfig;
  /**
   * Options for input source code.
   */
  source?: SourceConfig;
  /**
   * Options for build outputs.
   */
  output?: OutputConfig;
  /**
   * Options for Web security.
   */
  security?: SecurityConfig;
  /**
   * Options for build performance and runtime performance.
   */
  performance?: PerformanceConfig;
  /**
   * Options for module federation.
   */
  moduleFederation?: ModuleFederationConfig;
  /**
   * Configure Rsbuild plugins.
   */
  plugins?: RsbuildPlugins;
}

/**
 * The Rsbuild config.
 * */
export interface RsbuildConfig extends EnvironmentConfig {
  /**
   * Specify the Rsbuild build mode.
   */
  mode?: RsbuildMode;
  /**
   * Specify the project root directory. Can be an absolute path, or a path relative to `process.cwd()`.
   * @default `process.cwd()`
   */
  root?: string;
  /**
   * Options for local development.
   */
  dev?: DevConfig;
  /**
   * Options for the Rsbuild server,
   * will take effect during local development and preview.
   */
  server?: ServerConfig;
  /**
   * Configure rsbuild config by environment.
   */
  environments?: {
    [name: string]: EnvironmentConfig;
  };
  /**
   * Used to switch the bundler type.
   */
  provider?: unknown;
  /**
   * @private
   */
  _privateMeta?: RsbuildConfigMeta;
}

export type MergedEnvironmentConfig = {
  mode: RsbuildMode;
  root: string;
  dev: Pick<
    NormalizedDevConfig,
    'hmr' | 'assetPrefix' | 'progressBar' | 'lazyCompilation' | 'writeToDisk'
  >;
  html: NormalizedHtmlConfig;
  tools: NormalizedToolsConfig;
  resolve: NormalizedResolveConfig;
  source: NormalizedSourceConfig;
  output: Omit<NormalizedOutputConfig, 'distPath'> & {
    distPath: Omit<Required<DistPathConfig>, 'jsAsync' | 'cssAsync'> & {
      jsAsync?: string;
      cssAsync?: string;
    };
  };
  plugins?: RsbuildPlugins;
  security: NormalizedSecurityConfig;
  performance: NormalizedPerformanceConfig;
  moduleFederation?: ModuleFederationConfig;
};

/**
 * The normalized Rsbuild environment config.
 */
export type NormalizedEnvironmentConfig = DeepReadonly<
  Omit<MergedEnvironmentConfig, 'dev'> & {
    dev: NormalizedDevConfig;
    server: NormalizedServerConfig;
    _privateMeta?: RsbuildConfigMeta;
  }
>;

export type NormalizedConfig = NormalizedEnvironmentConfig & {
  provider?: unknown;
  environments: {
    [name: string]: NormalizedEnvironmentConfig;
  };
};
