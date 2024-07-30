import type RspackChain from 'rspack-chain';
import type { ChainIdentifier } from '..';
import type {
  EnvironmentConfig,
  HtmlBasicTag,
  MergedEnvironmentConfig,
  NormalizedEnvironmentConfig,
  RsbuildConfig,
} from './config';
import type { RsbuildEntry, RsbuildTarget } from './rsbuild';
import type { Rspack } from './rspack';
import type { MultiStats, Stats } from './stats';
import type { HtmlRspackPlugin, WebpackConfig } from './thirdParty';
import type { MaybePromise, NodeEnv } from './utils';

export type OnBeforeBuildFn<B = 'rspack'> = (params: {
  isFirstCompile: boolean;
  isWatch: boolean;
  bundlerConfigs?: B extends 'rspack'
    ? Rspack.Configuration[]
    : WebpackConfig[];
  environments: Record<string, EnvironmentContext>;
}) => MaybePromise<void>;

export type OnAfterBuildFn = (params: {
  isFirstCompile: boolean;
  isWatch: boolean;
  stats?: Stats | MultiStats;
  environments: Record<string, EnvironmentContext>;
}) => MaybePromise<void>;

export type OnCloseDevServerFn = () => MaybePromise<void>;

export type OnDevCompileDoneFn = (params: {
  isFirstCompile: boolean;
  stats: Stats | MultiStats;
  environments: Record<string, EnvironmentContext>;
}) => MaybePromise<void>;

export type OnBeforeStartDevServerFn = (params: {
  environments: Record<string, EnvironmentContext>;
}) => MaybePromise<void>;

export type OnBeforeStartProdServerFn = () => MaybePromise<void>;

export type Routes = Array<{
  entryName: string;
  pathname: string;
}>;

export type OnAfterStartDevServerFn = (params: {
  port: number;
  routes: Routes;
  environments: Record<string, EnvironmentContext>;
}) => MaybePromise<void>;

export type OnAfterStartProdServerFn = (params: {
  port: number;
  routes: Routes;
}) => MaybePromise<void>;

export type OnBeforeCreateCompilerFn<B = 'rspack'> = (params: {
  bundlerConfigs: B extends 'rspack' ? Rspack.Configuration[] : WebpackConfig[];
  environments: Record<string, EnvironmentContext>;
}) => MaybePromise<void>;

export type OnAfterCreateCompilerFn<
  Compiler = Rspack.Compiler | Rspack.MultiCompiler,
> = (params: {
  compiler: Compiler;
  environments: Record<string, EnvironmentContext>;
}) => MaybePromise<void>;

export type OnExitFn = () => void;

type HTMLTags = {
  headTags: HtmlBasicTag[];
  bodyTags: HtmlBasicTag[];
};

export type ModifyHTMLTagsContext = {
  /**
   * The Compilation object of Rspack.
   */
  compilation: Rspack.Compilation;
  /**
   * The Compiler object of Rspack.
   */
  compiler: Rspack.Compiler;
  /**
   * URL prefix of assets.
   * @example 'https://example.com/'
   */
  assetPrefix: string;
  /**
   * The name of the HTML file, relative to the dist directory.
   * @example 'index.html'
   */
  filename: string;
  /**
   * The environment context for current build.
   */
  environment: EnvironmentContext;
};

export type ModifyHTMLTagsFn = (
  tags: HTMLTags,
  context: ModifyHTMLTagsContext,
) => MaybePromise<HTMLTags>;

export type ModifyRsbuildConfigUtils = {
  /** Merge multiple Rsbuild config objects into one. */
  mergeRsbuildConfig: (...configs: RsbuildConfig[]) => RsbuildConfig;
};

type ArrayAtLeastOne<A, B> = [A, ...Array<A | B>] | [...Array<A | B>, A];

export type ModifyEnvironmentConfigUtils = {
  /** environment name. */
  name: string;
  /** Merge multiple Rsbuild environment config objects into one. */
  mergeEnvironmentConfig: (
    ...configs: ArrayAtLeastOne<MergedEnvironmentConfig, EnvironmentConfig>
  ) => MergedEnvironmentConfig;
};

export type ModifyRsbuildConfigFn = (
  config: RsbuildConfig,
  utils: ModifyRsbuildConfigUtils,
) => MaybePromise<RsbuildConfig | void>;

export type ModifyEnvironmentConfigFn = (
  config: MergedEnvironmentConfig,
  utils: ModifyEnvironmentConfigUtils,
) => MaybePromise<MergedEnvironmentConfig | void>;

export type EnvironmentContext = {
  index: number;
  name: string;
  entry: RsbuildEntry;
  htmlPaths: Record<string, string>;
  distPath: string;
  browserslist: string[];
  tsconfigPath?: string;
  config: NormalizedEnvironmentConfig;
};

export type ModifyChainUtils = {
  env: NodeEnv;
  isDev: boolean;
  isProd: boolean;
  target: RsbuildTarget;
  isServer: boolean;
  isWebWorker: boolean;
  CHAIN_ID: ChainIdentifier;
  environment: EnvironmentContext;
  HtmlPlugin: typeof HtmlRspackPlugin;
};

interface PluginInstance {
  apply: (compiler: any) => void;
  [k: string]: any;
}

export type ModifyBundlerChainUtils = ModifyChainUtils & {
  bundler: {
    BannerPlugin: PluginInstance;
    DefinePlugin: PluginInstance;
    IgnorePlugin: PluginInstance;
    ProvidePlugin: PluginInstance;
    HotModuleReplacementPlugin: PluginInstance;
  };
};

export type ModifyBundlerChainFn = (
  chain: RspackChain,
  utils: ModifyBundlerChainUtils,
) => MaybePromise<void>;

export type CreateAsyncHook<Callback extends (...args: any[]) => any> = {
  tap: (cb: Callback) => void;
  call: (...args: Parameters<Callback>) => Promise<Parameters<Callback>>;
};
