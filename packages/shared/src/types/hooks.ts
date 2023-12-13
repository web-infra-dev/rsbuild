import type { ChainIdentifier } from '../chain';
import type { Stats, MultiStats } from './stats';
import { NodeEnv, PromiseOrNot } from './utils';
import { RsbuildTarget } from './rsbuild';
import { BundlerChain } from './bundlerConfig';
import { mergeRsbuildConfig } from '../mergeRsbuildConfig';
import type { Rspack, RspackConfig } from './rspack';
import type { RsbuildConfig } from './config';
import type { WebpackConfig } from './thirdParty';

export type OnBeforeBuildFn<B = 'rspack'> = (params: {
  bundlerConfigs?: B extends 'rspack' ? RspackConfig[] : WebpackConfig[];
}) => PromiseOrNot<void>;

export type OnAfterBuildFn = (params: {
  stats?: Stats | MultiStats;
}) => PromiseOrNot<void>;

export type OnDevCompileDoneFn = (params: {
  isFirstCompile: boolean;
  stats: Stats | MultiStats;
}) => PromiseOrNot<void>;

export type OnBeforeStartDevServerFn = () => PromiseOrNot<void>;

export type OnBeforeStartProdServerFn = () => PromiseOrNot<void>;

export type Routes = Array<{
  name: string;
  route: string;
}>;

export type OnAfterStartDevServerFn = (params: {
  port: number;
  routes: Routes;
}) => PromiseOrNot<void>;

export type OnAfterStartProdServerFn = (params: {
  port: number;
  routes: Routes;
}) => PromiseOrNot<void>;

export type OnBeforeCreateCompilerFn<B = 'rspack'> = (params: {
  bundlerConfigs: B extends 'rspack' ? RspackConfig[] : WebpackConfig[];
}) => PromiseOrNot<void>;

export type OnAfterCreateCompilerFn<
  Compiler = Rspack.Compiler | Rspack.MultiCompiler,
> = (params: { compiler: Compiler }) => PromiseOrNot<void>;

export type OnExitFn = () => void;

export type ModifyRsbuildConfigUtils = {
  /** Merge multiple Rsbuild config objects into one. */
  mergeRsbuildConfig: typeof mergeRsbuildConfig;
};

export type ModifyRsbuildConfigFn = (
  config: RsbuildConfig,
  utils: ModifyRsbuildConfigUtils,
) => PromiseOrNot<RsbuildConfig | void>;

export type ModifyChainUtils = {
  env: NodeEnv;
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
) => PromiseOrNot<void>;

export type CreateAsyncHook<Callback extends (...args: any[]) => any> = {
  tap: (cb: Callback) => void;
  call: (...args: Parameters<Callback>) => Promise<Parameters<Callback>>;
};
