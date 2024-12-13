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

export type RouterOptions = {
  /**
   * Whether to enable static handler for React Router
   * @default true
   */
  staticHandler?: boolean;
  /**
   * Whether to enable data router for React Router
   * @default true
   */
  dataRouter?: boolean;
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
  /**
   * Whether to enable React Fast Refresh in development mode.
   * @default true
   */
  fastRefresh?: boolean;
  /**
   * React Router specific options
   */
  router?: RouterOptions;
};

export const PLUGIN_REACT_ROUTER_NAME = 'rsbuild:react-router';

export const pluginReactRouter = (
  options: PluginReactOptions = {},
): RsbuildPlugin => ({
  name: PLUGIN_REACT_ROUTER_NAME,

  setup(api) {
    const defaultOptions: PluginReactOptions = {
      fastRefresh: true,
      enableProfiler: false,
      router: {
        staticHandler: true,
        dataRouter: true,
      },
    };
    const finalOptions = {
      ...defaultOptions,
      ...options,
      router: {
        ...defaultOptions.router,
        ...options.router,
      },
    };

    // Detect if SSR is enabled by checking if node environment exists
    // const isSSR = Boolean(api.context.environments?.node);
    const isSSR = true;
    if (isSSR) {
      api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
        const ssrConfig = {
          output: {
            manifest: true,
          },
          source: {
            define: {
              __SSR__: 'true',
              __STATIC_HANDLER__: String(finalOptions.router?.staticHandler),
              __DATA_ROUTER__: String(finalOptions.router?.dataRouter),
            },
          },
          server: {
            htmlFallback: 'index' as const,
          },
        };
        return mergeRsbuildConfig(config, ssrConfig);
      });

      // Add router-specific aliases for SSR
      // api.modifyBundlerChain((chain) => {
      //   if (finalOptions.router?.staticHandler) {
      //     chain.resolve.alias
      //       .set('react-router', 'react-router/server')
      //       .set('react-router-dom', 'react-router-dom/server');
      //   }
      // });
    }

    if (api.context.bundlerType === 'rspack') {
      applyBasicReactSupport(api, finalOptions);

      if (finalOptions.enableProfiler) {
        applyReactProfiler(api);
      }
    }

    applySplitChunksRule(api, finalOptions?.splitChunks);
  },
});
