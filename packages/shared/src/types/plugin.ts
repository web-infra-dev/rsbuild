import type {
  OnExitFn,
  OnAfterBuildFn,
  OnBeforeBuildFn,
  OnDevCompileDoneFn,
  OnAfterStartDevServerFn,
  OnBeforeStartDevServerFn,
  OnAfterCreateCompilerFn,
  OnBeforeCreateCompilerFn,
  ModifyRsbuildConfigFn,
  ModifyBundlerChainFn,
} from './hooks';
import { Context } from './context';
import { RsbuildConfig, NormalizedConfig } from './config';
import { PromiseOrNot } from './utils';

export type PluginStore = {
  readonly plugins: RsbuildPlugin[];
  addPlugins: (plugins: RsbuildPlugin[], options?: { before?: string }) => void;
  removePlugins: (pluginNames: string[]) => void;
  isPluginExists: (pluginName: string) => boolean;
  /** The plugin API. */
  pluginAPI?: DefaultRsbuildPluginAPI;
};

export type RsbuildPlugin<API = any> = {
  name: string;
  setup: (api: API) => PromiseOrNot<void>;
  pre?: string[];
  post?: string[];
  remove?: string[];
};

type PluginsFn<T = void> = T extends void
  ? () => Promise<RsbuildPlugin>
  : (arg: T) => Promise<RsbuildPlugin>;

export type Plugins = {
  cleanOutput: PluginsFn;
  startUrl: PluginsFn;
  fileSize: PluginsFn;
  devtool: PluginsFn;
  target: PluginsFn;
  entry: PluginsFn;
  cache: PluginsFn;
  yaml: PluginsFn;
  toml: PluginsFn;
  splitChunks: PluginsFn;
  inlineChunk: PluginsFn;
  bundleAnalyzer: PluginsFn;
  asset: PluginsFn;
  html: PluginsFn;
  rem: PluginsFn;
  wasm: PluginsFn;
  moment: PluginsFn;
  nodeAddons: PluginsFn;
  externals: PluginsFn;
  networkPerformance: PluginsFn;
  preloadOrPrefetch: PluginsFn;
  performance: PluginsFn;
  define: PluginsFn;
};

/**
 * Define a generic Rsbuild plugin API that provider can extend as needed.
 */
export type DefaultRsbuildPluginAPI<
  Config extends Record<string, any> = Record<string, any>,
  NormalizedConfig extends Record<string, any> = Record<string, any>,
  BundlerConfig = unknown,
  Compiler = unknown,
> = {
  context: Readonly<Context>;
  isPluginExists: PluginStore['isPluginExists'];

  onExit: (fn: OnExitFn) => void;
  onAfterBuild: (fn: OnAfterBuildFn) => void;
  onBeforeBuild: (fn: OnBeforeBuildFn<BundlerConfig>) => void;
  onDevCompileDone: (fn: OnDevCompileDoneFn) => void;
  onAfterStartDevServer: (fn: OnAfterStartDevServerFn) => void;
  onBeforeStartDevServer: (fn: OnBeforeStartDevServerFn) => void;
  onAfterCreateCompiler: (fn: OnAfterCreateCompilerFn<Compiler>) => void;
  onBeforeCreateCompiler: (fn: OnBeforeCreateCompilerFn<BundlerConfig>) => void;

  /**
   * Get the relative paths of generated HTML files.
   * The key is entry name and the value is path.
   */
  getHTMLPaths: () => Record<string, string>;
  getRsbuildConfig: () => Readonly<Config>;
  getNormalizedConfig: () => NormalizedConfig;

  modifyRsbuildConfig: (fn: ModifyRsbuildConfigFn<Config>) => void;
  modifyBundlerChain: (fn: ModifyBundlerChainFn) => void;
};

export type SharedRsbuildPluginAPI = DefaultRsbuildPluginAPI<
  RsbuildConfig,
  NormalizedConfig
>;

export type DefaultRsbuildPlugin = RsbuildPlugin<SharedRsbuildPluginAPI>;
