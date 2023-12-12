import { join } from 'path';
import { pluginReact } from '@rsbuild/plugin-react';
import { createRsbuild } from '@rsbuild/core';
import express from 'express';

export async function startDevServer(fixtures) {
  const rsbuild = await createRsbuild({
    cwd: fixtures,
    rsbuildConfig: {
      plugins: [pluginReact()],
      server: {
        htmlFallback: false,
      },
    },
  });

  const app = express();

  const rsbuildServer = await rsbuild.createDevServer();

  const {
    resolvedConfig: { host, port, defaultRoutes },
  } = rsbuildServer;

  const { middlewares, close, upgrade } = await rsbuildServer.getMiddlewares();

  app.get('/aaa', (_req, res) => {
    res.send('Hello World!');
  });

  app.use(middlewares);

  app.get('/bbb', (_req, res) => {
    res.send('Hello Express!');
  });

  await rsbuildServer.beforeStart();

  const httpServer = app.listen({ host, port }, async () => {
    await rsbuildServer.afterStart({
      port,
      routes: defaultRoutes,
    });
  });

  // subscribe the server's http upgrade event to handle WebSocket upgrade
  httpServer.on('upgrade', upgrade);

  return {
    resolvedConfig: rsbuildServer.resolvedConfig,
    close: async () => {
      await close();
      httpServer.close();
    },
  };
}
