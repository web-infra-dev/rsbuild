import { join } from 'node:path';
import { pluginReact } from '@rsbuild/plugin-react';
import { createRsbuild } from '@rsbuild/core';
import polka from 'polka';

// startDevServer without compile
export async function startDevServerPure(fixtures) {
  const rsbuild = await createRsbuild({
    cwd: fixtures,
    rsbuildConfig: {
      plugins: [pluginReact()],
      server: {
        htmlFallback: false,
      },
      dev: {
        printUrls: false,
        setupMiddlewares: [
          (middlewares, server) => {
            middlewares.unshift((req, res, next) => {
              if (req.url === '/test') {
                res.writeHead(302, {
                  Location: '/bbb',
                });
                res.end();
              } else {
                next();
              }
            });
          },
        ],
      },
    },
  });

  const app = polka();

  const rsbuildServer = await rsbuild.createDevServer({ runCompile: false });

  const {
    config: { host, port },
    middlewares,
  } = rsbuildServer;

  app.get('/aaa', (_req, res) => {
    res.end('Hello World!');
  });

  app.use(middlewares);

  app.get('/bbb', (_req, res) => {
    res.end('Hello Express!');
  });

  const { server } = app.listen({ host, port }, async () => {
    await rsbuildServer.afterListen();
  });

  // subscribe the server's http upgrade event to handle WebSocket upgrade
  server.on('upgrade', rsbuildServer.onHTTPUpgrade);

  return {
    config: rsbuildServer.config,
    close: async () => {
      await rsbuildServer.close();
      server.close();
    },
  };
}
