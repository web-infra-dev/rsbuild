import {
  defineConfig,
  type RequestHandler,
  type RsbuildDevServer,
} from '@rsbuild/core';
import { pluginSolid } from '@rsbuild/plugin-solid';

const serverRender =
  ({ environments }: RsbuildDevServer): RequestHandler =>
  async (_req, res) => {
    const bundle = await environments.node.loadBundle<{
      render: () => {
        app: string;
        hydrationScript: string;
      };
    }>('index');
    const { app, hydrationScript } = bundle.render();
    const template = await environments.web.getTransformedHtml('index');

    res.writeHead(200, {
      'Content-Type': 'text/html',
    });
    res.end(
      template
        .replace('<!--hydration-script-->', hydrationScript)
        .replace('<!--app-content-->', app),
    );
  };

export default defineConfig({
  plugins: [pluginSolid({ ssr: true })],
  server: {
    setup: ({ action, server }) => {
      if (action !== 'dev') {
        return;
      }

      const render = serverRender(server);

      server.middlewares.use((req, res, next) => {
        if (req.method === 'GET' && req.url === '/') {
          return render(req, res, next);
        }

        next();
      });
    },
  },
  environments: {
    web: {
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
    },
  },
  html: {
    template: './template.html',
  },
});
