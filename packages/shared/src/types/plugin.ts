import type { Falsy, WebpackChain } from './utils';
import type {
  OnExitFn,
  OnAfterBuildFn,
  OnBeforeBuildFn,
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
import {
  RsbuildConfig,
  NormalizedConfig,
  ModifyRspackConfigUtils,
} from './config';
import type { PromiseOrNot } from './utils';
import type { RspackConfig } from './rspack';
import type {
  RuleSetRule,
  WebpackPluginInstance,
  Configuration as WebpackConfig,
} from 'webpack';
import type { ChainIdentifier } from '../chain';

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

export type PluginStore = {
  readonly plugins: RsbuildPlugin[];
  addPlugins: (plugins: RsbuildPlugins, options?: { before?: string }) => void;
  removePlugins: (pluginNames: string[]) => void;
  isPluginExists: (pluginName: string) => boolean;
  /** The plugin API. */
  pluginAPI?: RsbuildPluginAPI;
};

export type RsbuildPlugin = {
  name: string;
  setup: (api: RsbuildPluginAPI) => PromiseOrNot<void>;
  pre?: string[];
  post?: string[];
  remove?: string[];
};

export type RsbuildPlugins = (RsbuildPlugin | Falsy)[];

type PluginsFn<T = void> = T extends void
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
  yaml: PluginsFn;
  splitChunks: PluginsFn;
  inlineChunk: PluginsFn;
  bundleAnalyzer: PluginsFn;
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
};

export type GetRsbuildConfig = {
  (): Readonly<RsbuildConfig>;
  (type: 'original' | 'current'): Readonly<RsbuildConfig>;
  (type: 'normalized'): NormalizedConfig;
};

/**
 * Define a generic Rsbuild plugin API that provider can extend as needed.
 */
export type RsbuildPluginAPI = {
  context: Readonly<RsbuildContext>;
  isPluginExists: PluginStore['isPluginExists'];

  onExit: (fn: OnExitFn) => void;
  onAfterBuild: (fn: OnAfterBuildFn) => void;
  onBeforeBuild: (fn: OnBeforeBuildFn) => void;
  onDevCompileDone: (fn: OnDevCompileDoneFn) => void;
  onAfterStartDevServer: (fn: OnAfterStartDevServerFn) => void;
  onBeforeStartDevServer: (fn: OnBeforeStartDevServerFn) => void;
  onAfterStartProdServer: (fn: OnAfterStartProdServerFn) => void;
  onBeforeStartProdServer: (fn: OnBeforeStartProdServerFn) => void;
  onAfterCreateCompiler: (fn: OnAfterCreateCompilerFn) => void;
  onBeforeCreateCompiler: (fn: OnBeforeCreateCompilerFn) => void;

  /**
   * Get the relative paths of generated HTML files.
   * The key is entry name and the value is path.
   */
  getHTMLPaths: () => Record<string, string>;
  getRsbuildConfig: GetRsbuildConfig;
  getNormalizedConfig: () => NormalizedConfig;

  modifyRsbuildConfig: (fn: ModifyRsbuildConfigFn) => void;
  modifyBundlerChain: (fn: ModifyBundlerChainFn) => void;

  /** Only works when bundler is Rspack */
  modifyRspackConfig: (fn: ModifyRspackConfigFn) => void;
  /** Only works when bundler is Webpack */
  modifyWebpackChain: (fn: ModifyWebpackChainFn) => void;
  /** Only works when bundler is Webpack */
  modifyWebpackConfig: (fn: ModifyWebpackConfigFn) => void;
};
