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
  rspack,
} from '@rspack/core';
import type { WatchOptions } from 'chokidar';
import type {
  Options as HttpProxyOptions,
  Filter as ProxyFilter,
} from 'http-proxy-middleware';
import type RspackChain from 'rspack-chain';
import type { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
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
  mergeConfig: typeof import('webpack-merge').merge;
  rspack: typeof rspack;
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
   * Create aliases to import or require certain modules,
   * same as the [resolve.alias](https://rspack.dev/config/resolve) config of Rspack.
   */
  alias?: ConfigChain<Alias>;
  /**
   * Used to control the priority between the `paths` option in `tsconfig.json`
   * and the `alias` option in the bundler.
   */
  aliasStrategy?: AliasStrategy;
  /**
   * Specify directories or modules that need additional compilation.
   * In order to maintain faster compilation speed, Rsbuild will not compile files under node_modules through
   * `babel-loader` or `ts-loader` by default, as will as the files outside the current project directory.
   */
  include?: RuleSetCondition[];
  /**
   * Set the entry modules.
   */
  entry?: RsbuildEntry;
  /**
   * Specifies that certain files that will be excluded from compilation.
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
  alias: ConfigChain<Alias>;
  aliasStrategy: AliasStrategy;
  preEntry: string[];
  decorators: Required<Decorators>;
}

export type HtmlFallback = false | 'index';

export type ProxyBypass = (
  req: IncomingMessage,
  res: ServerResponse,
  proxyOptions: ProxyOptions,
) => string | undefined | null | boolean;

export type ProxyOptions = HttpProxyOptions & {
  /**
   * Bypass the proxy based on the return value of a function.
   * - Return `null` or `undefined` to continue processing the request with proxy.
   * - Return `true` to continue processing the request without proxy.
   * - Return `false` to produce a 404 error for the request.
   * - Return a path to serve from, instead of continuing to proxy the request.
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
   * Whether to copy files from the publicDir to the distDir on production build
   * @default true
   */
  copyOnBuild?: boolean;
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
   *
   * @default '/'
   */
  base?: string;
  /**
   * Whether to enable gzip compression
   */
  compress?: boolean;
  /**
   * Serving static files from the directory (by default 'public' directory)
   */
  publicDir?: PublicDir;
  /**
   * Specify a port number for Rsbuild Server to listen.
   */
  port?: number;
  /**
   * After configuring this option, you can enable HTTPS Server, and disabling the HTTP Server.
   */
  https?: HttpsServerOptions | SecureServerSessionOptions;
  /**
   * Used to set the host of Rsbuild Server.
   */
  host?: string;
  /**
   * Adds headers to all responses.
   */
  headers?: Record<string, string | string[]>;
  /**
   * Whether to support html fallback.
   */
  htmlFallback?: HtmlFallback;
  /**
   * Provide alternative pages for some 404 responses or other requests.
   * see https://github.com/bripkens/connect-history-api-fallback
   */
  historyApiFallback?: boolean | HistoryApiFallbackOptions;
  /**
   * Set the page URL to open when the server starts.
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
   * Configure proxy rules for the dev server or preview server to proxy requests to the specified service.
   */
  proxy?: ProxyConfig;
  /**
   * Whether to throw an error when the port is occupied.
   */
  strictPort?: boolean;
  /**
   * Whether to print the server urls when the server is started.
   */
  printUrls?: PrintUrls;
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
    >
  >;

export type SriAlgorithm = 'sha256' | 'sha384' | 'sha512';

export type SriOptions = {
  algorithm?: SriAlgorithm;
  enable?: boolean | 'auto';
};

export interface SecurityConfig {
  /**
   * Adding an nonce attribute to sub-resources introduced by HTML allows the browser to
   * verify the nonce of the introduced resource, thus preventing xss.
   */
  nonce?: string;

  /**
   * Adding an integrity attribute (`integrity`) to sub-resources introduced by HTML allows the browser to
   * verify the integrity of the introduced resource, thus preventing tampering with the downloaded resource.
   */
  sri?: SriOptions;
}

export type NormalizedSecurityConfig = Required<SecurityConfig>;

export type ConsoleType = 'log' | 'info' | 'warn' | 'error' | 'table' | 'group';

// may extends cache options in the futures
export type BuildCacheOptions = {
  /** Base directory for the filesystem cache. */
  cacheDirectory?: string;
  cacheDigest?: Array<string | undefined>;
};

export type PrintFileSizeOptions = {
  total?: boolean;
  detail?: boolean;
  compressed?: boolean;
};

export interface PreconnectOption {
  href: string;
  crossorigin?: boolean;
}

export type Preconnect = Array<string | PreconnectOption>;

export interface DnsPrefetchOption {
  href: string;
}

export type DnsPrefetch = string[];

export type PreloadIncludeType =
  | 'async-chunks'
  | 'initial'
  | 'all-assets'
  | 'all-chunks';

export type Filter = Array<string | RegExp> | ((filename: string) => boolean);

export interface PreloadOrPreFetchOption {
  type?: PreloadIncludeType;
  include?: Filter;
  exclude?: Filter;
}

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
   * Controls the Rsbuild's caching behavior during the build process.
   */
  buildCache?: BuildCacheOptions | boolean;

  /**
   * Whether to print the file sizes after production build.
   */
  printFileSize?: PrintFileSizeOptions | boolean;

  /**
   * Configure the chunk splitting strategy.
   */
  chunkSplit?: RsbuildChunkSplit;

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
   * Specifies that the user agent should preemptively perform DNS resolution for the target resource's origin.
   */
  dnsPrefetch?: DnsPrefetch;

  /**
   * Used to control resource `Preload`.
   *
   * Specifies that the user agent must preemptively fetch and cache the target resource for current navigation.
   */
  preload?: true | PreloadOrPreFetchOption;

  /**
   * Used to control resource `Prefetch`.
   *
   * Specifies that the user agent should preemptively fetch and cache the target resource as it is likely to be required for a followup navigation.
   */
  prefetch?: true | PreloadOrPreFetchOption;

  /**
   * Whether capture timing information for each module,
   * same as the [profile](https://webpack.js.org/configuration/other-options/#profile) config of webpack.
   */
  profile?: boolean;
}

export interface NormalizedPerformanceConfig extends PerformanceConfig {
  printFileSize: PrintFileSizeOptions | boolean;
  buildCache: BuildCacheOptions | boolean;
  chunkSplit: RsbuildChunkSplit;
}

export type SplitChunks = Configuration extends {
  optimization?: {
    splitChunks?: infer P;
  };
}
  ? P
  : never;

export type CacheGroups = Configuration extends {
  optimization?: {
    splitChunks?:
      | {
          cacheGroups?: infer P;
        }
      | false;
  };
}
  ? P
  : never;

export type CacheGroup = CacheGroups extends {
  [key: string]: infer P;
}
  ? P
  : null;

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

export type RsbuildChunkSplit = BaseChunkSplit | SplitBySize | SplitCustom;

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
   * The name of the JavaScript files.
   * @default
   * - dev: '[name].js'
   * - prod: '[name].[contenthash:8].js'
   */
  js?: NonNullable<Rspack.Configuration['output']>['filename'];
  /**
   * The name of the CSS files.
   * @default
   * - dev: '[name].css'
   * - prod: '[name].[contenthash:8].css'
   */
  css?: NonNullable<Rspack.Configuration['output']>['cssFilename'];
  /**
   * The name of the SVG images.
   * @default '[name].[contenthash:8].svg'
   */
  svg?: string;
  /**
   * The name of HTML files.
   * @default `[name].html`
   */
  html?: string;
  /**
   * The name of the font files.
   * @default '[name].[contenthash:8][ext]'
   */
  font?: string;
  /**
   * The name of non-SVG images.
   * @default '[name].[contenthash:8][ext]'
   */
  image?: string;
  /**
   * The name of media assets, such as video.
   * @default '[name].[contenthash:8][ext]'
   */
  media?: string;
  /**
   * the name of other assets, except for above (image, svg, font, html, wasm...)
   * @default '[name].[contenthash:8][ext]'
   */
  assets?: string;
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

export interface OutputConfig {
  /**
   * Specify build target to run in specified environment.
   * @default 'web'
   */
  target?: RsbuildTarget;
  /**
   * At build time, prevent some `import` dependencies from being packed into bundles in your code, and instead fetch them externally at runtime.
   * For more information, please see: [Rspack Externals](https://rspack.dev/config/externals)
   * @default undefined
   */
  externals?: Externals;
  /**
   * Set the directory of the dist files.
   * Rsbuild will output files to the corresponding subdirectory according to the file type.
   */
  distPath?: DistPathConfig;
  /**
   * Sets the filename of dist files.
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
   * similar to the output.publicPath config of webpack.
   * @default `server.base`
   */
  assetPrefix?: string;
  /**
   * Set the size threshold to inline static assets such as images and fonts.
   * By default, static assets will be Base64 encoded and inline into the page if the size is less than 4KiB.
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
   * Whether to clean all files in the dist path before starting compilation.
   * @default 'auto'
   */
  cleanDistPath?: boolean | 'auto';
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
   * Whether to generate manifest file.
   * @default false
   */
  manifest?: string | boolean;
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
  sourceMap?: SourceMap;
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
   * [Lightning CSS](https://github.com/parcel-bundler/lightningcss) to identify the JavaScript syntax that
   * need to be transformed and the CSS browser prefixes that need to be added.
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
}

export interface NormalizedOutputConfig extends OutputConfig {
  target: RsbuildTarget;
  filename: FilenameConfig;
  distPath: Omit<Required<DistPathConfig>, 'jsAsync' | 'cssAsync' | 'js'> &
    Pick<DistPathConfig, 'jsAsync' | 'cssAsync' | 'js'>;
  polyfill: Polyfill;
  sourceMap: {
    js?: Rspack.Configuration['devtool'];
    css: boolean;
  };
  filenameHash: boolean | string;
  assetPrefix: string;
  dataUriLimit: number | NormalizedDataUriLimit;
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

export type ChokidarWatchOptions = WatchOptions;

export type WatchFiles = {
  paths: string | string[];
  options?: WatchOptions;
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
   * similar to the [output.publicPath](https://rspack.dev/config/output#outputpublicpath) config of webpack.
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
        custom?: (shortcuts?: CliShortcut[]) => CliShortcut[];
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
   * This option allows you to configure a list of globs/directories/files to watch for file changes.
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
    'hmr' | 'assetPrefix' | 'progressBar' | 'lazyCompilation'
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
   * Options for source code parsing and compilation.
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
   * Options for the Rsbuild Server,
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
    'hmr' | 'assetPrefix' | 'progressBar' | 'lazyCompilation'
  >;
  html: NormalizedHtmlConfig;
  tools: NormalizedToolsConfig;
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
