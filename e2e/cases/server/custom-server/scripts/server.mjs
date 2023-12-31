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

  const serverAPIs = await rsbuild.getServerAPIs();

  const {
    config: { host, port },
  } = serverAPIs;

  const compileMiddlewareAPI = await serverAPIs.startCompile();

  const { middlewares, close, onUpgrade } = await serverAPIs.getMiddlewares({
    compileMiddlewareAPI,
  });

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
