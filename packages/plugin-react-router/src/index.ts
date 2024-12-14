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

export type PluginReactRouterOptions = {
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
  /**
   * Whether to enable Server-Side Rendering (SSR) support.
   * @default true
   */
  ssr?: boolean;
};

export const PLUGIN_REACT_ROUTER_NAME = 'rsbuild:react-router';

export const pluginReactRouter = (
  options: PluginReactRouterOptions = {},
): RsbuildPlugin => ({
  name: PLUGIN_REACT_ROUTER_NAME,

  setup(api) {
    const defaultOptions: PluginReactRouterOptions = {
      fastRefresh: true,
      enableProfiler: false,
      ssr: true,
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

    // General configuration for all cases
    api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
      const generalConfig = {
        server: {
          htmlFallback: 'index' as const,
        },
        environments: {
          web: {
            source: {
              entry: {
                client: './entry.client.tsx',
              },
            },
          },
        },
      };
      return mergeRsbuildConfig(config, generalConfig);
    });

    // SSR-specific configuration
    if (options.ssr) {
      api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
        const ssrConfig = {
          source: {
            define: {
              __SSR__: 'true',
              __STATIC_HANDLER__: String(finalOptions.router?.staticHandler),
              __DATA_ROUTER__: String(finalOptions.router?.dataRouter),
            },
          },
          environments: {
            node: {
              source: {
                entry: {
                  server: './entry.server.tsx',
                },
              },
            },
          },
        };
        return mergeRsbuildConfig(config, ssrConfig);
      });

      api.modifyEnvironmentConfig((config, { name }) => {
        if (name === 'web') {
          return {
            ...config,
            output: {
              ...config.output,
              manifest: true,
              target: 'web',
            },
          };
        }
        if (name === 'node') {
          return {
            ...config,
            output: {
              ...config.output,
              target: 'node',
              manifest: false,
            },
          };
        }
        return config;
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
