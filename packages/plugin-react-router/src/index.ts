import fs from 'node:fs';
import path from 'node:path';
import type { RouteConfig, RouteConfigEntry } from '@react-router/dev/routes';
import type { RsbuildPlugin, Rspack } from '@rsbuild/core';
import type { StatsAsset, StatsChunk } from '@rspack/core';
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
    const jiti = createJiti(api.context.rootPath);
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
      const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
      const baseFilename = filename.replace(/\.[^/.]+$/, ''); // Remove extension if present

      for (const ext of extensions) {
        const filePath = path.join(
          api.context.rootPath,
          `${baseFilename}${ext}`,
        );
        if (fs.existsSync(filePath)) {
          return true;
        }
      }

      return false;
    };

    // Helper function to find the first existing routes file
    const findRoutesFile = () => {
      const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];
      const baseRoutesPath = path.join(api.context.rootPath, 'app/routes');

      for (const ext of extensions) {
        const filePath = `${baseRoutesPath}${ext}`;
        if (fs.existsSync(filePath)) {
          return filePath;
        }
      }

      // Default to .tsx if no file is found
      return path.join(api.context.rootPath, 'app/routes.tsx');
    };

    // Get the appropriate entry path
    const getEntryPath = (filename: string) => {
      const userEntry = `./${filename}`;
      if (checkUserEntry(filename)) {
        return userEntry;
      }
      // Return the path to our default template
      return path.join('@rsbuild/plugin-react-router', 'templates', filename);
    };

    // Add resolve configuration for user-routes
    api.modifyBundlerChain((chain) => {
      chain.resolve.alias.set('user-routes', findRoutesFile());
    });

    // General configuration for all cases
    api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
      const generalConfig = {
        server: {
          htmlFallback: 'index' as const,
        },
        environments: {
          node: {
            source: {
              entry: {
                server: `${getEntryPath('entry.server')}?virtual`,
              },
            },
          },
          web: {
            source: {
              entry: {
                client: getEntryPath('entry.client'),
              },
            },
          },
        },
      } as {
        server: { htmlFallback: 'index' };
        environments: {
          web: {
            source: {
              entry: { client: string };
            };
          };
          node?: {
            source: {
              entry: { server: string };
            };
          };
        };
      };
      if (!options.ssr) {
        delete generalConfig.environments.node;
      }
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
        };
        return mergeRsbuildConfig(config, ssrConfig);
      });

      let clientStats: Rspack.StatsCompilation | undefined;
      let clientStatsPromise: Promise<Rspack.StatsCompilation | undefined>;
      let clientStatsResolve!: (
        stats: Rspack.StatsCompilation | undefined,
      ) => void;
      let clientStatsReject!: (error: Error) => void;
      let isWebCompilationComplete = false;

      // Reset promise on each new compilation cycle
      const resetClientStatsPromise = () => {
        clientStatsPromise = new Promise((resolve, reject) => {
          clientStatsResolve = resolve;
          clientStatsReject = reject;
        });
        isWebCompilationComplete = false;
      };

      api.onAfterEnvironmentCompile(({ stats, environment }) => {
        if (environment.name === 'web') {
          try {
            clientStats = stats?.toJson();
            isWebCompilationComplete = true;
            clientStatsResolve(stats?.toJson());
          } catch (error) {
            clientStatsReject(
              error instanceof Error
                ? error
                : new Error('Failed to process web compilation stats'),
            );
          }
        }
      });

      resetClientStatsPromise();

      api.onBeforeEnvironmentCompile(({ environment }) => {
        if (environment.name === 'node' && !isWebCompilationComplete) {
          return clientStatsPromise
            .catch((error) => {
              console.error('Failed to get web compilation stats:', error);
              throw error;
            })
            .then(() => undefined);
        }
      });

      api.onDevCompileDone(() => {
        resetClientStatsPromise();
      });

      // Transform for routes file
      api.transform(
        {
          test: new RegExp(findRoutesFile().replace(/\./g, '\\.')),
          environments: ['node'],
        },
        async ({ resourcePath }) => {
          const configModule = await (jiti.import(resourcePath, {
            default: true,
          }) as RouteConfig);

          // Wrap the config in a root route
          const rootConfig: RouteConfig = [
            {
              file: 'root.tsx',
              children: configModule,
            },
          ];

          const routeImports: string[] = [];
          let moduleCounter = 0;

          function processRoute(route: RouteConfigEntry) {
            const moduleVar = `route${moduleCounter++}`;
            // Skip dynamic import for root file
            if (/^root\.(tsx?|jsx?|mjs|js)$/.test(route.file)) {
              routeImports.push(`import ${moduleVar} from './${route.file}';`);
              return moduleVar;
            }
            // Convert file path to chunk name by removing extension and converting slashes to dashes
            const chunkName = route.file
              .replace(/\.[^/.]+$/, '') // remove extension
              .replace(/\//g, '-'); // replace slashes with dashes
            routeImports.push(
              `const ${moduleVar} = import(/* webpackChunkName: "routes/${chunkName}" */ './${route.file}');`,
            );
            return moduleVar;
          }

          interface RouteObject {
            id: string;
            parentId: string | undefined;
            path: string | undefined;
            index: boolean | undefined;
            caseSensitive: boolean | undefined;
            module: string;
          }

          const routes: Record<string, RouteObject> = {};

          function processRouteRecursive(
            route: RouteConfigEntry,
            parentId?: string,
          ) {
            const moduleVar = processRoute(route);
            const routeId = path.parse(route.file).name;
            routes[routeId] = {
              id: routeId,
              parentId,
              path: route.path ?? undefined,
              index: route.index ?? undefined,
              caseSensitive: route.caseSensitive ?? undefined,
              module: moduleVar,
            };

            if (route.children) {
              for (const child of route.children) {
                processRouteRecursive(child, routeId);
              }
            }
          }

          for (const route of rootConfig) {
            processRouteRecursive(route);
          }

          const fileContent = `
${routeImports.join('\n')}

export const routes = ${JSON.stringify(routes, null, 2).replace(/"(route\d+)"/g, '$1')};
`;

          return fileContent;
        },
      );

      // Add transform for virtual server entry
      api.transform(
        {
          test: /entry\.server\.(tsx?|jsx?|mjs)$/,
          resourceQuery: /\?virtual/,
        },
        ({ resourcePath }) => {
          const normalized = api.getNormalizedConfig();
          const serverStats = clientStats;
          const entrypoint = serverStats?.entrypoints?.client;
          const namedChunks = serverStats?.namedChunkGroups || {};
          const publicPath = normalized.output?.assetPrefix || '/';
          const basename = normalized.server?.base || '/';
          const distPath = normalized.output?.distPath;
          const rootDistPath = distPath?.root || 'dist';

          // Helper function to get asset path with correct dist directory
          const getAssetPath = (assetName: string) => {
            if (assetName.endsWith('.css')) {
              return `${distPath?.css || 'static/css'}/${assetName}`;
            }
            if (assetName.endsWith('.js')) {
              return `${distPath?.js || 'static/js'}/${assetName}`;
            }
            return `${distPath?.assets || 'static/assets'}/${assetName}`;
          };

          // Process routes to include chunk information
          const routeManifest: Record<string, any> = {};
          for (const [name, chunk] of Object.entries(
            namedChunks as Record<string, StatsChunk>,
          )) {
            if (!name.startsWith('routes/') && name !== 'root') continue;

            const id = name;
            const parentId = name === 'root' ? undefined : 'root';
            const isIndex = name !== 'root';

            // Filter JS and CSS assets
            const jsAssets =
              chunk.assets
                ?.filter((asset: StatsAsset) => asset.name.endsWith('.js'))
                .map((asset: StatsAsset) => getAssetPath(asset.name)) || [];

            const cssAssets =
              chunk.assets
                ?.filter((asset: StatsAsset) => asset.name.endsWith('.css'))
                .map((asset: StatsAsset) => getAssetPath(asset.name)) || [];

            routeManifest[name] = {
              id,
              parentId,
              path: name === 'root' ? '' : undefined,
              index: isIndex,
              caseSensitive: undefined,
              hasAction: false,
              hasLoader: false,
              hasClientAction: false,
              hasClientLoader: false,
              hasErrorBoundary: name === 'root',
              module: jsAssets[0] || '',
              imports: jsAssets.slice(1) || [],
              css: cssAssets,
            };
          }

          const manifest = {
            entry: {
              module: entrypoint?.assets?.[0]?.name
                ? getAssetPath(entrypoint.assets[0].name)
                : '',
              imports: (entrypoint?.assets?.slice(1) || [])
                .filter((asset) => asset.name.endsWith('.js'))
                .map((asset) => getAssetPath(asset.name)),
              css: (entrypoint?.assets || [])
                .filter((asset) => asset.name.endsWith('.css'))
                .map((asset) => getAssetPath(asset.name)),
            },
            routes: routeManifest,
            url: `${distPath?.js || 'static/js'}/manifest-${serverStats?.hash}.js`,
            version: serverStats?.hash || '',
          };
          // Return the virtual server entry content
          return `
import * as userServerEntry from '${resourcePath.replace(/\?.*$/, '')}';

export const entry = {
  module: userServerEntry
};

// Import routes from the user's app
import { routes } from 'user-routes';

// Export server manifest and other required properties
const serverManifest = ${JSON.stringify(manifest, null, 2)};
const assetsBuildDirectory = ${JSON.stringify(rootDistPath)};
const basename = ${JSON.stringify(basename)};
const future = { "unstable_optimizeDeps": false };
const isSpaMode = false;
const publicPath = ${JSON.stringify(publicPath)};

export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  publicPath,
  routes
};
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

      // Add transform to handle react-router development imports
      api.transform(
        { test: /react-router\/dist\/development\/index/ },
        ({ code }) => {
          // First rename the original function to _loadRouteModule
          let newCode = code.replace(
            /async function loadRouteModule/,
            'async function _loadRouteModule',
          );

          // Then add our new function implementation
          const newLoadRouteModule = `
async function loadRouteModule(route, routeModulesCache) {
  if (route.id in routeModulesCache) {
    return routeModulesCache[route.id];
  }
  try {
    let routeModule = await import(route.module);
    routeModulesCache[route.id] = routeModule;
    return routeModule;
  } catch (error) {
    console.error(
      \`Error loading route module \${route.module}, reloading page...\`,
    );
    console.error(error);
    if (window.__reactRouterContext && window.__reactRouterContext.isSpaMode) {
      throw error;
    }
    window.location.reload();
    return new Promise(() => {});
  }
}`;

          // Add the new function after the renamed one
          newCode = `${newCode}\n\n${newLoadRouteModule}`;
          // debugger;
          return {
            code: newCode,
          };
        },
      );

      if (finalOptions.enableProfiler) {
        applyReactProfiler(api);
      }
    }

    applySplitChunksRule(api, finalOptions?.splitChunks);
  },
});
