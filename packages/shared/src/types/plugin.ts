import type { Falsy, WebpackChain } from './utils';
import type {
  OnExitFn,
  OnAfterBuildFn,
  OnBeforeBuildFn,
  OnCloseDevServerFn,
  OnDevCompileDoneFn,
  OnAfterStartDevServerFn,
  OnBeforeStartDevServerFn,
  OnAfterStartProdServerFn,
  OnBeforeStartProdServerFn,
  OnAfterCreateCompilerFn,
  OnBeforeCreateCompilerFn,
  ModifyRsbuildConfigFn,
  ModifyBundlerChainFn,
  ModifyChainUtils,
} from './hooks';
import type { RsbuildContext } from './context';
import type {
  RsbuildConfig,
  NormalizedConfig,
  ModifyRspackConfigUtils,
} from './config';
import type { MaybePromise } from './utils';
import type { RspackConfig, RspackSourceMap } from './rspack';
import type { RuleSetCondition } from '@rspack/core';
import type {
  RuleSetRule,
  WebpackPluginInstance,
  Configuration as WebpackConfig,
} from 'webpack';
import type { ChainIdentifier } from '../chain';

type HookOrder = 'pre' | 'post' | 'default';

export type HookDescriptor<T extends (...args: any[]) => any> = {
  handler: T;
  order: HookOrder;
};

export type AsyncHook<Callback extends (...args: any[]) => any> = {
  tap: (cb: Callback | HookDescriptor<Callback>) => void;
  call: (...args: Parameters<Callback>) => Promise<Parameters<Callback>>;
};

export type ModifyRspackConfigFn = (
  config: RspackConfig,
  utils: ModifyRspackConfigUtils,
) => Promise<RspackConfig | void> | RspackConfig | void;

export type ModifyWebpackChainUtils = ModifyChainUtils & {
  webpack: typeof import('webpack');
  CHAIN_ID: ChainIdentifier;
  /**
   * @deprecated Use target instead.
   * */
  name: string;
  /**
   * @deprecated Use HtmlPlugin instead.
   */
  HtmlWebpackPlugin: typeof import('html-webpack-plugin');
};

export type ModifyWebpackConfigUtils = ModifyWebpackChainUtils & {
  addRules: (rules: RuleSetRule | RuleSetRule[]) => void;
  prependPlugins: (
    plugins: WebpackPluginInstance | WebpackPluginInstance[],
  ) => void;
  appendPlugins: (
    plugins: WebpackPluginInstance | WebpackPluginInstance[],
  ) => void;
  removePlugin: (pluginName: string) => void;
  mergeConfig: typeof import('../../compiled/webpack-merge').merge;
};

export type ModifyWebpackChainFn = (
  chain: WebpackChain,
  utils: ModifyWebpackChainUtils,
) => Promise<void> | void;

export type ModifyWebpackConfigFn = (
  config: WebpackConfig,
  utils: ModifyWebpackConfigUtils,
) => Promise<WebpackConfig | void> | WebpackConfig | void;

export type PluginManager = {
  readonly plugins: RsbuildPlugin[];
  addPlugins: (
    plugins: Array<RsbuildPlugin | Falsy>,
    options?: { before?: string },
  ) => void;
  removePlugins: (pluginNames: string[]) => void;
  isPluginExists: (pluginName: string) => boolean;
  /** The plugin API. */
  pluginAPI?: RsbuildPluginAPI;
};

/**
 * The type of the Rsbuild plugin object.
 */
export type RsbuildPlugin = {
  /**
   * The name of the plugin, a unique identifier.
   */
  name: string;
  /**
   * The setup function of the plugin, which can be an async function.
   * This function is called once when the plugin is initialized.
   * @param api provides the context info, utility functions and lifecycle hooks.
   */
  setup: (api: RsbuildPluginAPI) => MaybePromise<void>;
  /**
   * Declare the names of pre-plugins, which will be executed before the current plugin.
   */
  pre?: string[];
  /**
   * Declare the names of post-plugins, which will be executed after the current plugin.
   */
  post?: string[];
  /**
   * Declare the plugins that need to be removed, you can pass an array of plugin names.
   */
  remove?: string[];
};

export type RsbuildPlugins = (
  | RsbuildPlugin
  | Falsy
  | Promise<RsbuildPlugin | Falsy>
)[];

type PluginsFn<T = undefined> = T extends undefined
  ? () => Promise<RsbuildPlugin>
  : (arg: T) => Promise<RsbuildPlugin>;

export type Plugins = {
  basic: PluginsFn;
  cleanOutput: PluginsFn;
  startUrl: PluginsFn;
  fileSize: PluginsFn;
  target: PluginsFn;
  entry: PluginsFn;
  cache: PluginsFn;
  splitChunks: PluginsFn;
  inlineChunk: PluginsFn;
  bundleAnalyzer: PluginsFn;
  rsdoctor: PluginsFn;
  asset: PluginsFn;
  html: PluginsFn;
  wasm: PluginsFn;
  moment: PluginsFn;
  nodeAddons: PluginsFn;
  externals: PluginsFn;
  networkPerformance: PluginsFn;
  preloadOrPrefetch: PluginsFn;
  performance: PluginsFn;
  define: PluginsFn;
  server: PluginsFn;
  moduleFederation: PluginsFn;
};

export type GetRsbuildConfig = {
  (): Readonly<RsbuildConfig>;
  (type: 'original' | 'current'): Readonly<RsbuildConfig>;
  (type: 'normalized'): NormalizedConfig;
};

type PluginHook<T extends (...args: any[]) => any> = (
  options: T | HookDescriptor<T>,
) => void;

type TransformResult =
  | string
  | {
      code: string;
      map?: string | RspackSourceMap | null;
    };

export type TransformHandler = (context: {
  /**
   * The code of the module.
   */
  code: string;
  /**
   * The absolute path of the module, including the query.
   * @example '/home/user/project/src/index.js?foo=123'
   */
  resource: string;
  /**
   * The absolute path of the module, without the query.
   * @example '/home/user/project/src/index.js'
   */
  resourcePath: string;
  /**
   * The query of the module.
   * @example '?foo=123'
   */
  resourceQuery: string;
  /**
   * Add an additional file as the dependency.
   * The file will be watched and changes to the file will trigger rebuild.
   * @param file The absolute path of the module.
   */
  addDependency: (file: string) => void;
}) => MaybePromise<TransformResult>;

export type TransformFn = (
  descriptor: {
    /**
     * Include modules that match the test assertion, the same as `rule.test`
     * @see https://rspack.dev/config/module#ruletest
     */
    test?: RuleSetCondition;
  },
  handler: TransformHandler,
) => void;

/**
 * Define a generic Rsbuild plugin API that provider can extend as needed.
 */
export type RsbuildPluginAPI = Readonly<{
  context: Readonly<RsbuildContext>;
  isPluginExists: PluginManager['isPluginExists'];

  onExit: PluginHook<OnExitFn>;
  onAfterBuild: PluginHook<OnAfterBuildFn>;
  onBeforeBuild: PluginHook<OnBeforeBuildFn>;
  onCloseDevServer: PluginHook<OnCloseDevServerFn>;
  onDevCompileDone: PluginHook<OnDevCompileDoneFn>;
  onAfterStartDevServer: PluginHook<OnAfterStartDevServerFn>;
  onBeforeStartDevServer: PluginHook<OnBeforeStartDevServerFn>;
  onAfterStartProdServer: PluginHook<OnAfterStartProdServerFn>;
  onBeforeStartProdServer: PluginHook<OnBeforeStartProdServerFn>;
  onAfterCreateCompiler: PluginHook<OnAfterCreateCompilerFn>;
  onBeforeCreateCompiler: PluginHook<OnBeforeCreateCompilerFn>;

  modifyRsbuildConfig: PluginHook<ModifyRsbuildConfigFn>;
  modifyBundlerChain: PluginHook<ModifyBundlerChainFn>;
  /** Only works when bundler is Rspack */
  modifyRspackConfig: PluginHook<ModifyRspackConfigFn>;
  /** Only works when bundler is Webpack */
  modifyWebpackChain: PluginHook<ModifyWebpackChainFn>;
  /** Only works when bundler is Webpack */
  modifyWebpackConfig: PluginHook<ModifyWebpackConfigFn>;

  /**
   * Get the relative paths of generated HTML files.
   * The key is entry name and the value is path.
   */
  getHTMLPaths: () => Record<string, string>;
  getRsbuildConfig: GetRsbuildConfig;
  getNormalizedConfig: () => NormalizedConfig;

  /**
   * For plugin communication
   */
  expose: <T = any>(id: string | symbol, api: T) => void;
  useExposed: <T = any>(id: string | symbol) => T | undefined;

  /**
   * @experimental
   * This is an experimental and may introduce breaking change in patch releases.
   * It will be stable in Rsbuild v0.6.0
   */
  transform: TransformFn;
}>;
