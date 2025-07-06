import type { RsbuildPlugin, Rspack } from '@rsbuild/core';
import type { PluginOptions as ReactRefreshOptions } from '@rspack/plugin-react-refresh';
import { applyBasicReactSupport, applyReactProfiler } from './react.js';
import { applySplitChunksRule } from './splitChunks.js';

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
  swcReactOptions?: Rspack.SwcLoaderTransformConfig['react'];
  /**
   * Configuration for chunk splitting of React-related dependencies.
   */
  splitChunks?: SplitReactChunkOptions;
  /**
   * When set to `true`, enables the React Profiler for performance analysis in production builds.
   * @default false
   */
  enableProfiler?: boolean;
  /**
   * Options passed to `@rspack/plugin-react-refresh`
   * @default
   * {
   *   include: [/\.(?:js|jsx|mjs|cjs|ts|tsx|mts|cts)$/],
   *   exclude: [/[\\/]node_modules[\\/]/],
   *   resourceQuery: { not: /^\?raw$/ },
   * }
   * @see https://rspack.rs/guide/tech/react#rspackplugin-react-refresh
   */
  reactRefreshOptions?: ReactRefreshOptions;
  /**
   * Whether to enable React Fast Refresh in development mode.
   * @default true
   */
  fastRefresh?: boolean;
};

export const PLUGIN_REACT_NAME = 'rsbuild:react';

export const pluginReact = (
  options: PluginReactOptions = {},
): RsbuildPlugin => ({
  name: PLUGIN_REACT_NAME,

  setup(api) {
    const defaultOptions: PluginReactOptions = {
      fastRefresh: true,
      enableProfiler: false,
    };
    const finalOptions = {
      ...defaultOptions,
      ...options,
    };

    if (api.context.bundlerType === 'rspack') {
      applyBasicReactSupport(api, finalOptions);

      if (finalOptions.enableProfiler) {
        applyReactProfiler(api);
      }
    }

    applySplitChunksRule(api, finalOptions?.splitChunks);
  },
});
