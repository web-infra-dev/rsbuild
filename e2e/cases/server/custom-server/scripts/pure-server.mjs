import { join } from 'path';
import { pluginReact } from '@rsbuild/plugin-react';
import { createRsbuild } from '@rsbuild/core';
import express from 'express';

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
                req.url = '/bbb';
              }
              next();
            });
          },
        ],
      },
    },
  });

  const app = express();

  const serverAPIs = await rsbuild.getServerAPIs();

  const {
    config: { host, port },
  } = serverAPIs;

  const { middlewares, close, onUpgrade } = await serverAPIs.getMiddlewares();

  app.get('/aaa', (_req, res) => {
    res.send('Hello World!');
  });

  app.use(middlewares);

  app.get('/bbb', (_req, res) => {
    res.send('Hello Express!');
  });

  await serverAPIs.beforeStart();

  const httpServer = app.listen({ host, port }, async () => {
    await serverAPIs.afterStart();
  });

  // subscribe the server's http upgrade event to handle WebSocket upgrade
  httpServer.on('upgrade', onUpgrade);

  return {
    config: serverAPIs.config,
    close: async () => {
      await close();
      httpServer.close();
    },
  };
}
