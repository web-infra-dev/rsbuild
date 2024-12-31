import type { ParseResult } from '@babel/parser';
import type { NodePath } from '@babel/traverse';
import type {
  CallExpression,
  Declaration,
  ExportDeclaration,
  Expression,
  File,
  FunctionDeclaration,
  Identifier,
  ImportDeclaration,
  ImportSpecifier,
  Node,
  StringLiteral,
  VariableDeclaration,
  VariableDeclarator,
} from '@babel/types';
import type { Config } from '@react-router/dev/config';
import type { RouteConfigEntry } from '@react-router/dev/routes';
import type { RsbuildPlugin, Rspack } from '@rsbuild/core';
import * as esbuild from 'esbuild';
import { $ } from 'execa';
import { createJiti } from 'jiti';
import jsesc from 'jsesc';
import { isAbsolute, relative, resolve } from 'pathe';
import { RspackVirtualModulePlugin } from 'rspack-plugin-virtual-module';
import { generate, parse, t, traverse } from './babel.js';
import {
  combineURLs,
  createRouteId,
  generateWithProps,
  removeExports,
  toFunctionExpression,
} from './plugin-utils.js';

export type PluginOptions = {
  /**
   * Whether to enable Server-Side Rendering (SSR) support.
   * @default true
   */
  ssr?: boolean;
  /**
   * Build directory for output files
   * @default 'build'
   */
  buildDirectory?: string;
  /**
   * Application source directory
   * @default 'app'
   */
  appDirectory?: string;
  /**
   * Base URL path
   * @default '/'
   */
  basename?: string;
};

export const PLUGIN_NAME = 'rsbuild:react-router';

export const SERVER_ONLY_ROUTE_EXPORTS = [
  'loader',
  'action',
  'headers',
] as const;
export const CLIENT_ROUTE_EXPORTS = [
  'clientAction',
  'clientLoader',
  'default',
  'ErrorBoundary',
  'handle',
  'HydrateFallback',
  'Layout',
  'links',
  'meta',
  'shouldRevalidate',
] as const;
export const NAMED_COMPONENT_EXPORTS = [
  'HydrateFallback',
  'ErrorBoundary',
] as const;

export type Route = {
  id: string;
  parentId?: string;
  file: string;
  path?: string;
  index?: boolean;
  caseSensitive?: boolean;
  children?: Route[];
};

export type RouteManifestItem = Omit<Route, 'file' | 'children'> & {
  module: string;
  hasAction: boolean;
  hasLoader: boolean;
  hasClientAction: boolean;
  hasClientLoader: boolean;
  hasErrorBoundary: boolean;
  imports: string[];
  css: string[];
};

export const reactRouterPlugin = (
  options: PluginOptions = {},
): RsbuildPlugin => ({
  name: PLUGIN_NAME,

  async setup(api) {
    const defaultOptions = {
      ssr: true,
      buildDirectory: 'build',
      appDirectory: 'app',
      basename: '/',
    };

    const finalOptions = {
      ...defaultOptions,
      ...options,
    };

    // Run typegen on build/dev
    api.onBeforeStartDevServer(async () => {
      $`npx --yes react-router typegen --watch`;
    });

    api.onBeforeBuild(async () => {
      await $`npx --yes react-router typegen`;
    });

    const jiti = createJiti(process.cwd());

    // Read the react-router.config.ts file first
    const {
      appDirectory = finalOptions.appDirectory,
      basename = finalOptions.basename,
      buildDirectory = finalOptions.buildDirectory,
      ssr = finalOptions.ssr,
    } = await jiti
      .import<Config>('./react-router.config.ts', {
        default: true,
      })
      .catch(() => {
        console.error(
          'No react-router.config.ts found, using default configuration.',
        );
        return {} as Config;
      });

    // Update finalOptions with config values
    finalOptions.appDirectory = appDirectory;
    finalOptions.basename = basename;
    finalOptions.buildDirectory = buildDirectory;
    finalOptions.ssr = ssr;

    // Then read the routes
    const routeConfig = await jiti
      .import<RouteConfigEntry[]>(
        resolve(finalOptions.appDirectory, 'routes.ts'),
        {
          default: true,
        },
      )
      .catch(() => {
        console.error('No routes.ts found in app directory.');
        return [] as RouteConfigEntry[];
      });

    const entryClientPath = resolve(
      finalOptions.appDirectory,
      'entry.client.tsx',
    );
    const entryServerPath = resolve(
      finalOptions.appDirectory,
      'entry.server.tsx',
    );
    const rootRouteFile = relative(
      finalOptions.appDirectory,
      resolve(finalOptions.appDirectory, 'root.tsx'),
    );

    const routes = {
      root: { path: '', id: 'root', file: rootRouteFile },
      ...configRoutesToRouteManifest(finalOptions.appDirectory, routeConfig),
    };

    const outputClientPath = resolve(finalOptions.buildDirectory, 'client');
    const assetsBuildDirectory = relative(process.cwd(), outputClientPath);

    let clientStats: Rspack.StatsCompilation | undefined;
    api.onAfterEnvironmentCompile(({ stats, environment }) => {
      if (environment.name === 'web') {
        clientStats = stats?.toJson();
      }
    });

    // Create virtual modules for React Router
    const vmodPlugin = new RspackVirtualModulePlugin({
      'virtual/react-router/browser-manifest': 'export default {};',
      'virtual/react-router/server-manifest': 'export default {};',
      'virtual/react-router/server-build': generateServerBuild(routes, {
        entryServerPath,
        assetsBuildDirectory,
        basename: finalOptions.basename,
        appDirectory: finalOptions.appDirectory,
        ssr: finalOptions.ssr,
      }),
      'virtual/react-router/with-props': generateWithProps(),
    });

    // Modify Rsbuild config
    api.modifyRsbuildConfig(async (config, { mergeRsbuildConfig }) => {
      return mergeRsbuildConfig(config, {
        output: {
          assetPrefix: '/',
        },
        dev: {
          writeToDisk: true,
        },
        tools: {
          rspack: {
            plugins: [vmodPlugin],
          },
        },
        environments: {
          web: {
            source: {
              entry: {
                'entry.client': entryClientPath,
                'virtual/react-router/browser-manifest':
                  'virtual/react-router/browser-manifest',
                ...Object.values(routes).reduce(
                  (acc, route) =>
                    Object.assign({}, acc, {
                      [route.file.slice(0, route.file.lastIndexOf('.'))]:
                        `${resolve(
                          finalOptions.appDirectory,
                          route.file,
                        )}?react-router-route`,
                    }),
                  {},
                ),
              },
            },
            output: {
              distPath: {
                root: outputClientPath,
              },
            },
            tools: {
              rspack: {
                name: 'web',
                devtool: false,
                experiments: {
                  outputModule: true,
                },
                externalsType: 'module',
                output: {
                  chunkFormat: 'module',
                  chunkLoading: 'import',
                  workerChunkLoading: 'import',
                  wasmLoading: 'fetch',
                  library: { type: 'module' },
                  module: true,
                },
                optimization: {
                  runtimeChunk: 'single',
                },
              },
            },
          },
          node: {
            source: {
              entry: {
                app: './server/app.ts',
                'entry.server': entryServerPath,
              },
            },
            output: {
              distPath: {
                root: resolve(finalOptions.buildDirectory, 'server'),
              },
              target: 'node',
            },
            tools: {
              rspack: {
                externals: ['express'],
                dependencies: ['web'],
              },
            },
          },
        },
      });
    });

    // Add environment-specific modifications
    api.modifyEnvironmentConfig(
      async (config, { name, mergeEnvironmentConfig }) => {
        if (name === 'web') {
          return mergeEnvironmentConfig(config, {
            tools: {
              rspack: (rspackConfig) => {
                if (rspackConfig.plugins) {
                  rspackConfig.plugins.push({
                    apply(compiler: Rspack.Compiler) {
                      compiler.hooks.emit.tapAsync(
                        'ModifyBrowserManifest',
                        async (compilation: Rspack.Compilation, callback) => {
                          const manifest = await getReactRouterManifestForDev(
                            routes,
                            finalOptions,
                            compilation.getStats().toJson(),
                          );

                          const manifestPath =
                            'static/js/virtual/react-router/browser-manifest.js';
                          const manifestContent = `window.__reactRouterManifest=${jsesc(manifest, { es6: true })};`;

                          if (compilation.assets[manifestPath]) {
                            const originalSource = compilation.assets[
                              manifestPath
                            ]
                              .source()
                              .toString();
                            const newSource = originalSource.replace(
                              /["'`]PLACEHOLDER["'`]/,
                              jsesc(manifest, { es6: true }),
                            );
                            compilation.assets[manifestPath] = {
                              source: () => newSource,
                              size: () => newSource.length,
                              map: () => ({
                                version: 3,
                                sources: [manifestPath],
                                names: [],
                                mappings: '',
                                file: manifestPath,
                                sourcesContent: [newSource],
                              }),
                              sourceAndMap: () => ({
                                source: newSource,
                                map: {
                                  version: 3,
                                  sources: [manifestPath],
                                  names: [],
                                  mappings: '',
                                  file: manifestPath,
                                  sourcesContent: [newSource],
                                },
                              }),
                              updateHash: (hash) => hash.update(newSource),
                              buffer: () => Buffer.from(newSource),
                            };
                          }
                          callback();
                        },
                      );
                    },
                  });
                }
                return rspackConfig;
              },
            },
          });
        }
        return config;
      },
    );

    // Add manifest transformations
    api.transform(
      {
        test: /virtual\/react-router\/(browser|server)-manifest/,
      },
      async (args) => {
        // For browser manifest, return a placeholder that will be modified by the plugin
        if (args.environment.name === 'web') {
          return {
            code: `window.__reactRouterManifest = "PLACEHOLDER";`,
          };
        }

        // For server manifest, use the clientStats as before
        const manifest = await getReactRouterManifestForDev(
          routes,
          finalOptions,
          clientStats,
        );
        return {
          code: `export default ${jsesc(manifest, { es6: true })};`,
        };
      },
    );

    // Add route transformation
    api.transform(
      {
        resourceQuery: /\?react-router-route/,
      },
      async (args) => {
        let code = (
          await esbuild.transform(args.code, {
            jsx: 'automatic',
            format: 'esm',
            platform: 'neutral',
            loader: args.resourcePath.endsWith('x') ? 'tsx' : 'ts',
          })
        ).code;

        const defaultExportMatch = code.match(
          /\n\s{0,}([\w\d_]+)\sas default,?/,
        );
        if (
          defaultExportMatch &&
          typeof defaultExportMatch.index === 'number'
        ) {
          code =
            code.slice(0, defaultExportMatch.index) +
            code.slice(defaultExportMatch.index + defaultExportMatch[0].length);
          code += `\nexport default ${defaultExportMatch[1]};`;
        }

        const ast = parse(code, { sourceType: 'module' });
        if (args.environment.name === 'web') {
          removeExports(ast, [...SERVER_ONLY_ROUTE_EXPORTS]);
        }
        transformRoute(ast);

        return generate(ast, {
          sourceMaps: true,
          filename: args.resource,
          sourceFileName: args.resourcePath,
        });
      },
    );
  },
});

// Helper functions
function configRoutesToRouteManifest(
  appDirectory: string,
  routes: RouteConfigEntry[],
  rootId = 'root',
) {
  const routeManifest: Record<string, Route> = {};

  function walk(route: RouteConfigEntry, parentId: string) {
    const id = route.id || createRouteId(route.file);
    const manifestItem = {
      id,
      parentId,
      file: isAbsolute(route.file)
        ? relative(appDirectory, route.file)
        : route.file,
      path: route.path,
      index: route.index,
      caseSensitive: route.caseSensitive,
    };

    if (Object.prototype.hasOwnProperty.call(routeManifest, id)) {
      throw new Error(
        `Unable to define routes with duplicate route id: "${id}"`,
      );
    }
    routeManifest[id] = manifestItem;

    if (route.children) {
      for (const child of route.children) {
        walk(child, id);
      }
    }
  }

  for (const route of routes) {
    walk(route, rootId);
  }

  return routeManifest;
}

async function getReactRouterManifestForDev(
  routes: Record<string, Route>,
  options: PluginOptions,
  clientStats?: Rspack.StatsCompilation,
) {
  const result: Record<string, RouteManifestItem> = {};
  for (const [key, route] of Object.entries(routes)) {
    const assets = clientStats?.assetsByChunkName?.[route.id];
    const jsAssets = assets?.filter((asset) => asset.endsWith('.js')) || [];
    const cssAssets = assets?.filter((asset) => asset.endsWith('.css')) || [];
    result[key] = {
      id: route.id,
      parentId: route.parentId,
      path: route.path,
      index: route.index,
      caseSensitive: route.caseSensitive,
      module: combineURLs(
        '/static/js/',
        `${route.file.slice(0, route.file.lastIndexOf('.'))}.js`,
      ),
      hasAction: false,
      hasLoader: route.id === 'routes/home',
      hasClientAction: false,
      hasClientLoader: false,
      hasErrorBoundary: route.id === 'root',
      imports: jsAssets.map((asset) => combineURLs('/', asset)),
      css: cssAssets.map((asset) => combineURLs('/', asset)),
    };
  }

  const entryAssets = clientStats?.assetsByChunkName?.['entry.client'];
  const entryJsAssets =
    entryAssets?.filter((asset) => asset.endsWith('.js')) || [];
  const entryCssAssets =
    entryAssets?.filter((asset) => asset.endsWith('.css')) || [];

  return {
    version: String(Math.random()),
    url: '/static/js/virtual/react-router/browser-manifest.js',
    entry: {
      module: '/static/js/entry.client.js',
      imports: entryJsAssets.map((asset) => combineURLs('/', asset)),
      css: entryCssAssets.map((asset) => combineURLs('/', asset)),
    },
    routes: result,
  };
}

/**
 * Generates the server build module content
 * @param routes The route manifest
 * @param options Build options
 * @returns The generated module content as a string
 */
function generateServerBuild(
  routes: Record<string, Route>,
  options: {
    entryServerPath: string;
    assetsBuildDirectory: string;
    basename: string;
    appDirectory: string;
    ssr: boolean;
  },
): string {
  return `
    import * as entryServer from ${JSON.stringify(options.entryServerPath)};
    ${Object.keys(routes)
      .map((key, index) => {
        const route = routes[key];
        return `import * as route${index} from ${JSON.stringify(
          `${resolve(options.appDirectory, route.file)}?react-router-route`,
        )};`;
      })
      .join('\n')}

    export { default as assets } from "virtual/react-router/server-manifest";
    export const assetsBuildDirectory = ${JSON.stringify(
      options.assetsBuildDirectory,
    )};
    export const basename = ${JSON.stringify(options.basename)};
    export const future = ${JSON.stringify({})};
    export const isSpaMode = ${!options.ssr};
    export const publicPath = "/";
    export const entry = { module: entryServer };
    export const routes = {
      ${Object.keys(routes)
        .map((key, index) => {
          const route = routes[key];
          return `${JSON.stringify(key)}: {
            id: ${JSON.stringify(route.id)},
            parentId: ${JSON.stringify(route.parentId)},
            path: ${JSON.stringify(route.path)},
            index: ${JSON.stringify(route.index)},
            caseSensitive: ${JSON.stringify(route.caseSensitive)},
            module: route${index}
          }`;
        })
        .join(',\n  ')}
    };
  `;
}

export const transformRoute = (ast: ParseResult<File>): void => {
  const hocs: Array<[string, Identifier]> = [];
  function getHocUid(path: NodePath, hocName: string): Identifier {
    const uid = path.scope.generateUidIdentifier(hocName);
    hocs.push([hocName, uid]);
    return uid;
  }

  traverse(ast, {
    ExportDeclaration(path: NodePath) {
      if (path.isExportDefaultDeclaration()) {
        const declaration = path.get('declaration');
        // prettier-ignore
        const expr =
              declaration.isExpression() ? declaration.node :
                  declaration.isFunctionDeclaration() ? toFunctionExpression(declaration.node) :
                      undefined
        if (expr) {
          const uid = getHocUid(path, 'withComponentProps');
          declaration.replaceWith(t.callExpression(uid, [expr]));
        }
        return;
      }

      if (path.isExportNamedDeclaration()) {
        const decl = path.get('declaration');

        if (decl.isVariableDeclaration()) {
          // biome-ignore lint/complexity/noForEach: <explanation>
          decl.get('declarations').forEach((varDeclarator: NodePath) => {
            const id = varDeclarator.get('id');
            const init = varDeclarator.get('init');
            if (Array.isArray(init)) return;
            if (Array.isArray(id)) return;
            const expr = init.node;
            if (!expr) return;
            if (!id.isIdentifier()) return;
            const { name } = id.node;
            if (
              !NAMED_COMPONENT_EXPORTS.includes(
                name as (typeof NAMED_COMPONENT_EXPORTS)[number],
              )
            )
              return;

            const uid = getHocUid(path, `with${name}Props`);
            init.replaceWith(t.callExpression(uid, [expr as Expression]));
          });
          return;
        }

        if (decl.isFunctionDeclaration()) {
          const { id } = decl.node;
          if (!id) return;
          const { name } = id;
          if (
            !NAMED_COMPONENT_EXPORTS.includes(
              name as (typeof NAMED_COMPONENT_EXPORTS)[number],
            )
          )
            return;

          const uid = getHocUid(path, `with${name}Props`);
          decl.replaceWith(
            t.variableDeclaration('const', [
              t.variableDeclarator(
                t.identifier(name),
                t.callExpression(uid, [toFunctionExpression(decl.node)]),
              ),
            ]),
          );
        }
      }
    },
  });

  if (hocs.length > 0) {
    ast.program.body.unshift(
      t.importDeclaration(
        hocs.map(([name, identifier]) =>
          t.importSpecifier(identifier, t.identifier(name)),
        ),
        t.stringLiteral('virtual/react-router/with-props'),
      ),
    );
  }
};
