import {
  type RequestHandler,
  type SetupMiddlewaresServer,
  defineConfig,
  logger,
} from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export const serverRender =
  (serverAPI: SetupMiddlewaresServer): RequestHandler =>
  async (_req, res, _next) => {
    const indexModule = await serverAPI.environments.node.loadBundle<{
      render: () => string;
    }>('index');

    const markup = indexModule.render();

    const template =
      await serverAPI.environments.web.getTransformedHtml('index');

    const html = template.replace('<!--app-content-->', markup);

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
          return {
            ...config,
            experiments: {
              ...config.experiments,
              outputModule: true,
            },
            output: {
              ...config.output,
              chunkFormat: 'module',
              chunkLoading: 'import',
              library: {
                type: 'module',
              },
            },
          };
        },
      },
    },
  },
  html: {
    template: './template.html',
  },
});
