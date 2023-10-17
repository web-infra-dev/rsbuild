import type { ModifyChainUtils } from '@rsbuild/shared';
import type { RspackConfig, RspackRule, RspackPluginInstance } from './rspack';

export type ModifyRspackConfigUtils = ModifyChainUtils & {
  addRules: (rules: RspackRule | RspackRule[]) => void;
  prependPlugins: (
    plugins: RspackPluginInstance | RspackPluginInstance[],
  ) => void;
  appendPlugins: (
    plugins: RspackPluginInstance | RspackPluginInstance[],
  ) => void;
  removePlugin: (pluginName: string) => void;
  mergeConfig: typeof import('@rsbuild/shared/webpack-merge').merge;
  rspack: typeof import('@rspack/core');
};

export type ModifyRspackConfigFn = (
  config: RspackConfig,
  utils: ModifyRspackConfigUtils,
) => Promise<RspackConfig | void> | RspackConfig | void;
