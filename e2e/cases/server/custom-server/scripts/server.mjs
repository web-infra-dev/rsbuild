import { join } from 'node:path';
import { pluginReact } from '@rsbuild/plugin-react';
import { createRsbuild } from '@rsbuild/core';
import polka from 'polka';

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

  const app = polka();

  const serverAPIs = await rsbuild.getServerAPIs();

  const {
    config: { host, port },
  } = serverAPIs;

  const compileMiddlewareAPI = await serverAPIs.startCompile();

  const { middlewares, close, onUpgrade } = await serverAPIs.getMiddlewares({
    compileMiddlewareAPI,
  });

  app.get('/aaa', (_req, res) => {
    res.end('Hello World!');
  });

  for (const item of middlewares) {
    if (Array.isArray(item)) {
      app.use(...item);
    } else {
      app.use(item);
    }
  }

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
