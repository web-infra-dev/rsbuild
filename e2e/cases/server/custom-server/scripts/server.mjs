import { join } from 'path';
import { pluginReact } from '@rsbuild/plugin-react';
import { createRsbuild } from '@rsbuild/core';
import express from 'express';

export async function startDevServer(fixtures) {
  const rsbuild = await createRsbuild({
    cwd: fixtures,
    rsbuildConfig: {
      plugins: [pluginReact()],
      source: {
        entry: {
          index: join(fixtures, 'src/index.js'),
        },
      },
      server: {
        htmlFallback: false,
      },
    },
  });

  const rsbuildServer = await rsbuild.createDevServer();

  const app = express();

  const {
    resolvedConfig: { host, port, defaultRoutes, devServerConfig },
  } = rsbuildServer;

  app.get('/aaa', (_req, res) => {
    res.send('Hello World!');
  });

  const { middlewares, close, upgrade } = await rsbuildServer.getMiddlewares({
    dev: devServerConfig,
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
