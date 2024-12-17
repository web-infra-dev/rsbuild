import fs from 'node:fs';
import path from 'node:path';
import type { RsbuildPlugin, Rspack } from '@rsbuild/core';
import type { PluginOptions as ReactRefreshOptions } from '@rspack/plugin-react-refresh';
import { createJiti } from 'jiti';
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

  async setup(api) {
    const jiti = createJiti(process.cwd());
    //@ts-ignore
    let configModule = await jiti.import('./app/routes', {});
    console.log(configModule);
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

    // Function to check if user has provided their own entry files
    const checkUserEntry = (filename: string) => {
      const userEntry = path.join(api.context.rootPath, filename);
      return fs.existsSync(userEntry);
    };

    // Get the appropriate entry path
    const getEntryPath = (filename: string) => {
      const userEntry = `./${filename}`;
      if (checkUserEntry(filename)) {
        return userEntry;
      }
      // Return the path to our default template
      return path.join(__dirname, 'templates', filename);
    };

    // Add resolve configuration for user-routes
    api.modifyBundlerChain((chain) => {
      chain.resolve.alias.set(
        'user-routes',
        checkUserEntry('app/routes.tsx')
          ? path.join(api.context.rootPath, 'app/routes.js')
          : path.join(api.context.rootPath, 'app/routes.tsx'),
      );
    });

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
                client: getEntryPath('entry.client.tsx'),
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
                  server: `${getEntryPath('entry.server.tsx')}?virtual`,
                },
              },
            },
          },
        };
        return mergeRsbuildConfig(config, ssrConfig);
      });

      // Add transform for virtual server entry
      api.transform(
        {
          test: /entry\.server\.(tsx?|jsx?|mjs)$/,
          resourceQuery: /\?virtual/,
        },
        ({ resourcePath }) => {
          // Return the virtual server entry content
          return `
import type { ServerBuild } from "react-router";
import * as userServerEntry from '${resourcePath.replace(/\?.*$/, '')}';

export const entry: ServerBuild["entry"] = {
  module: userServerEntry
};

// Import routes from the user's app
import routes from 'user-routes';
// Export the routes configuration
export { routes };

// Export other required ServerBuild properties
export const assets: ServerBuild["assets"] = {
  entry: { imports: [], module: "" },
  routes: {},
  url: "",
  version: "1"
};

export const publicPath: ServerBuild["publicPath"] = "/";
export const assetsBuildDirectory: ServerBuild["assetsBuildDirectory"] = "";
export const future: ServerBuild["future"] = {};
export const isSpaMode: ServerBuild["isSpaMode"] = false;
export const basename: ServerBuild["basename"] = undefined;
`;
        },
      );

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
