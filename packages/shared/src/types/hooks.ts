import type { ChainIdentifier } from '../chain';
import type { Stats, MultiStats } from './stats';
import { NodeEnv, PromiseOrNot } from './utils';
import { RsbuildTarget } from './rsbuild';
import { BundlerChain } from './bundlerConfig';
import { mergeRsbuildConfig } from '../mergeRsbuildConfig';

export type OnBeforeBuildFn<BundlerConfig = unknown> = (params: {
  bundlerConfigs?: BundlerConfig[];
}) => PromiseOrNot<void>;

export type OnAfterBuildFn = (params: {
  stats?: Stats | MultiStats;
}) => PromiseOrNot<void>;

export type OnDevCompileDoneFn = (params: {
  isFirstCompile: boolean;
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

export type OnBeforeCreateCompilerFn<BundlerConfig = unknown> = (params: {
  bundlerConfigs: BundlerConfig[];
}) => PromiseOrNot<void>;

export type OnAfterCreateCompilerFn<Compiler = unknown> = (params: {
  compiler: Compiler;
}) => PromiseOrNot<void>;

export type OnExitFn = () => void;

export type ModifyRsbuildConfigUtils = {
  /** Merge multiple Rsbuild config objects into one. */
  mergeRsbuildConfig: typeof mergeRsbuildConfig;
};

export type ModifyRsbuildConfigFn<RsbuildConfig> = (
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
