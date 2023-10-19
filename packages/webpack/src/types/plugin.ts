import type {
  DefaultRsbuildPluginAPI,
  RsbuildPlugin as BaseRsbuildPlugin,
} from '@rsbuild/shared';
import type { Compiler, MultiCompiler } from 'webpack';
import type { RsbuildConfig, NormalizedConfig } from './config';
import type { WebpackConfig } from './thirdParty';
import type { ModifyWebpackChainFn, ModifyWebpackConfigFn } from './hooks';

export interface RsbuildPluginAPI
  extends DefaultRsbuildPluginAPI<
    RsbuildConfig,
    NormalizedConfig,
    WebpackConfig,
    Compiler | MultiCompiler
  > {
  // Modifiers
  modifyWebpackChain: (fn: ModifyWebpackChainFn) => void;
  modifyWebpackConfig: (fn: ModifyWebpackConfigFn) => void;
}

export type RsbuildPlugin = BaseRsbuildPlugin<RsbuildPluginAPI>;
