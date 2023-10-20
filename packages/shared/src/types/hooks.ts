import type { ChainIdentifier } from '@modern-js/utils/chain-id';
import type { Stats, MultiStats } from './stats';
import { NodeEnv, PromiseOrNot } from './utils';
import { RsbuildTarget } from './rsbuild';
import { BundlerChain } from './bundlerConfig';
import { mergeRsbuildConfig } from '../mergeRsbuildConfig';
import type { WebpackPluginInstance } from 'webpack';

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

export type OnAfterStartDevServerFn = (params: {
  port: number;
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
  getCompiledPath: (name: string) => string;
  // todo: html plugin type declare
  HtmlPlugin: any;
  /**
   * @private should only used in Rsbuild
   */
  webpack: typeof import('webpack');
};

export type ModifyBundlerChainUtils = ModifyChainUtils & {
  bundler: {
    BannerPlugin: WebpackPluginInstance;
    DefinePlugin: WebpackPluginInstance;
    ProvidePlugin: WebpackPluginInstance;
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
