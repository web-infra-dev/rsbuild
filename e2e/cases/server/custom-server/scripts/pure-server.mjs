import { join } from 'path';
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
        setupMiddlewares: [
          (middlewares, server) => {
            middlewares.unshift((req, res, next) => {
              if (req.url === '/test') {
                res.writeHead(302, {
                  Location: '/bbb',
                });
                res.end();
              }
              next();
            });
          },
        ],
      },
    },
  });

  const app = polka();

  const serverAPIs = await rsbuild.getServerAPIs();

  const {
    config: { host, port },
  } = serverAPIs;

  const { middlewares, close, onUpgrade } = await serverAPIs.getMiddlewares();

  app.get('/aaa', (_req, res) => {
    res.end('Hello World!');
  });

  app.use(...middlewares);

  app.get('/bbb', (_req, res) => {
    res.end('Hello Express!');
  });

  await serverAPIs.beforeStart();

  const { server } = app.listen({ host, port }, async () => {
    await serverAPIs.afterStart();
  });

  // subscribe the server's http upgrade event to handle WebSocket upgrade
  server.on('upgrade', onUpgrade);

  return {
    config: serverAPIs.config,
    close: async () => {
      await close();
      server.close();
    },
  };
}
