import type { RsbuildPlugin } from '@rsbuild/core';
import type { SwcReactConfig } from '@rsbuild/shared';
import { applySplitChunksRule } from './splitChunks';
import { applyBasicReactSupport } from './react';

export type SplitReactChunkOptions = {
  /**
   * Whether to enable split chunking for React-related dependencies (e.g., react, react-dom, scheduler).
   *
   * @default true
   */
  react?: boolean;
  /**
   * Whether to enable split chunking for routing-related dependencies (e.g., react-router, react-router-dom, history).
   *
   * @default true
   */
  router?: boolean;
};

export type PluginReactOptions = {
  /**
   * Configure the behavior of SWC to transform React code,
   * the same as SWC's [jsc.transform.react](https://swc.rs/docs/configuration/compilation#jsctransformreact).
   */
  swcReactOptions?: SwcReactConfig;
  /**
   * Configuration for chunk splitting of React-related dependencies.
   */
  splitChunks?: SplitReactChunkOptions;
};

export const PLUGIN_REACT_NAME = 'rsbuild:react';

export const pluginReact = (
  options: PluginReactOptions = {},
): RsbuildPlugin => ({
  name: PLUGIN_REACT_NAME,

  setup(api) {
    if (api.context.bundlerType === 'rspack') {
      applyBasicReactSupport(api, options);
    }

    applySplitChunksRule(api, options?.splitChunks);
  },
});
