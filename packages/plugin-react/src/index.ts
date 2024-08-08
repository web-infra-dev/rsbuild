import type { RsbuildPlugin, Rspack } from '@rsbuild/core';
import type { PluginOptions as ReactRefreshOptions } from '@rspack/plugin-react-refresh';
import { applyBasicReactSupport, applyReactProfiler } from './react';
import { applySplitChunksRule } from './splitChunks';

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
   * @see https://rspack.dev/guide/tech/react#rspackplugin-react-refresh
   */
  reactRefreshOptions?: ReactRefreshOptions;
};

export const PLUGIN_REACT_NAME = 'rsbuild:react';

export const pluginReact = ({
  enableProfiler = false,
  ...options
}: PluginReactOptions = {}): RsbuildPlugin => ({
  name: PLUGIN_REACT_NAME,

  setup(api) {
    if (api.context.bundlerType === 'rspack') {
      applyBasicReactSupport(api, options);

      if (enableProfiler) {
        applyReactProfiler(api);
      }
    }

    applySplitChunksRule(api, options?.splitChunks);
  },
});
