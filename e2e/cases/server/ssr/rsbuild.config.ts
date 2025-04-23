import {
  type RequestHandler,
  type SetupMiddlewaresServer,
  defineConfig,
  logger,
} from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export const serverRender =
  ({ environments }: SetupMiddlewaresServer): RequestHandler =>
  async (_req, res, _next) => {
    const bundle = await environments.node.loadBundle<{
      render: () => string;
    }>('index');
    const rendered = bundle.render();
    const template = await environments.web.getTransformedHtml('index');
    const html = template.replace('<!--app-content-->', rendered);

    res.writeHead(200, {
      'Content-Type': 'text/html',
    });
    res.end(html);
  };

export default defineConfig({
  plugins: [pluginReact()],
  dev: {
    setupMiddlewares: [
      ({ unshift }, serverAPI) => {
        const serverRenderMiddleware = serverRender(serverAPI);

        unshift(async (req, res, next) => {
          if (req.method === 'GET' && req.url === '/') {
            try {
              await serverRenderMiddleware(req, res, next);
            } catch (err) {
              logger.error('SSR render error, downgrade to CSR...\n', err);
              next();
            }
          } else {
            next();
          }
        });
      },
    ],
  },
  environments: {
    web: {
      output: {
        target: 'web',
      },
      source: {
        entry: {
          index: './src/index',
        },
      },
    },
    node: {
      output: {
        target: 'node',
      },
      source: {
        entry: {
          index: './src/index.server',
        },
      },
      tools: {
        rspack: (config) => {
          if (process.env.TEST_ESM_LIBRARY) {
            return {
              ...config,
              experiments: {
                ...config.experiments,
                outputModule: true,
              },
              output: {
                ...config.output,
                filename: '[name].mjs',
                chunkFilename: '[name].mjs',
                chunkFormat: 'module',
                chunkLoading: 'import',
                library: {
                  type: 'module',
                },
              },
            };
          }

          if (process.env.TEST_SPLIT_CHUNK) {
            return {
              ...config,
              optimization: {
                runtimeChunk: true,
                splitChunks: {
                  chunks: 'all',
                  minSize: 0,
                  cacheGroups: {
                    'lib-react': {
                      test: /node_modules[\\/](react|react-dom|scheduler|react-refresh|@rspack[\\/]plugin-react-refresh)[\\/]/,
                      priority: 0,
                      name: 'lib-react',
                    },
                  },
                },
              },
            };
          }
          return config;
        },
      },
    },
  },
  html: {
    template: './template.html',
  },
});
