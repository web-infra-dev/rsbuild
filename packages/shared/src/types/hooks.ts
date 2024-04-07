import type { ChainIdentifier } from '../chain';
import type { Stats, MultiStats } from './stats';
import type { NodeEnv, MaybePromise } from './utils';
import type { RsbuildTarget } from './rsbuild';
import type { BundlerChain } from './bundlerConfig';
import type { Rspack, RspackConfig } from './rspack';
import type { RsbuildConfig } from './config';
import type { WebpackConfig } from './thirdParty';

export type OnBeforeBuildFn<B = 'rspack'> = (params: {
  bundlerConfigs?: B extends 'rspack' ? RspackConfig[] : WebpackConfig[];
}) => MaybePromise<void>;

export type OnAfterBuildFn = (params: {
  isFirstCompile: boolean;
  stats?: Stats | MultiStats;
}) => MaybePromise<void>;

export type OnCloseDevServerFn = () => MaybePromise<void>;

export type OnDevCompileDoneFn = (params: {
  isFirstCompile: boolean;
  stats: Stats | MultiStats;
}) => MaybePromise<void>;

export type OnBeforeStartDevServerFn = () => MaybePromise<void>;

export type OnBeforeStartProdServerFn = () => MaybePromise<void>;

export type Routes = Array<{
  entryName: string;
  pathname: string;
}>;

export type OnAfterStartDevServerFn = (params: {
  port: number;
  routes: Routes;
}) => MaybePromise<void>;

export type OnAfterStartProdServerFn = (params: {
  port: number;
  routes: Routes;
}) => MaybePromise<void>;

export type OnBeforeCreateCompilerFn<B = 'rspack'> = (params: {
  bundlerConfigs: B extends 'rspack' ? RspackConfig[] : WebpackConfig[];
}) => MaybePromise<void>;

export type OnAfterCreateCompilerFn<
  Compiler = Rspack.Compiler | Rspack.MultiCompiler,
> = (params: { compiler: Compiler }) => MaybePromise<void>;

export type OnExitFn = () => void;

export type ModifyRsbuildConfigUtils = {
  /** Merge multiple Rsbuild config objects into one. */
  mergeRsbuildConfig: (...configs: RsbuildConfig[]) => RsbuildConfig;
};

export type ModifyRsbuildConfigFn = (
  config: RsbuildConfig,
  utils: ModifyRsbuildConfigUtils,
) => MaybePromise<RsbuildConfig | void>;

export type ModifyChainUtils = {
  env: NodeEnv;
  isDev: boolean;
  isProd: boolean;
  target: RsbuildTarget;
  isServer: boolean;
  isServiceWorker: boolean;
  isWebWorker: boolean;
  CHAIN_ID: ChainIdentifier;
  HtmlPlugin: typeof import('html-webpack-plugin');
  /**
   * @private internal API
   */
  getCompiledPath: (name: string) => string;
};

interface PluginInstance {
  apply: (compiler: any) => void;
  [k: string]: any;
}

export type ModifyBundlerChainUtils = ModifyChainUtils & {
  bundler: {
    BannerPlugin: PluginInstance;
    DefinePlugin: PluginInstance;
    ProvidePlugin: PluginInstance;
    HotModuleReplacementPlugin: PluginInstance;
  };
};

/** The intersection of webpack-chain and rspack-chain */
export type ModifyBundlerChainFn = (
  chain: BundlerChain,
  utils: ModifyBundlerChainUtils,
) => MaybePromise<void>;

export type CreateAsyncHook<Callback extends (...args: any[]) => any> = {
  tap: (cb: Callback) => void;
  call: (...args: Parameters<Callback>) => Promise<Parameters<Callback>>;
};
