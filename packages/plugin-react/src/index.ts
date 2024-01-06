import type { RsbuildPlugin } from '@rsbuild/core';
import { applyAntdSupport } from './antd';
import { applyArcoSupport } from './arco';
import { applySplitChunksRule } from './splitChunks';
import { applyBasicReactSupport } from './react';

export { isBeyondReact17 } from './utils';

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
   * Decides which React JSX runtime to use.
   * `automatic` auto imports the functions for transpiled JSX. `classic` does not automatic import anything.
   * @default 'automatic'
   */
  jsxRuntime?: 'classic' | 'automatic';
  /**
   * Configuration for chunk splitting of React-related dependencies.
   */
  splitChunks?: SplitReactChunkOptions;
};

export const pluginReact = (
  options: PluginReactOptions = {},
): RsbuildPlugin => ({
  name: 'rsbuild:react',

  pre: ['rsbuild:swc'],

  setup(api) {
    if (api.context.bundlerType === 'rspack') {
      applyBasicReactSupport(api, options);
    }
    applyAntdSupport(api);
    applyArcoSupport(api);
    applySplitChunksRule(api, options?.splitChunks);
  },
});
