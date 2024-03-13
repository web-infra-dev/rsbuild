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

  const rsbuildServer = await rsbuild.createDevServer();

  const {
    middlewares,
    close,
    onHTTPUpgrade,
    afterListen,
    config: { host, port },
  } = rsbuildServer;

  app.get('/aaa', (_req, res) => {
    res.end('Hello World!');
  });

  middlewares.forEach((item) => {
    if (Array.isArray(item)) {
      app.use(...item);
    } else {
      app.use(item);
    }
  });

  app.get('/bbb', (_req, res) => {
    res.end('Hello Express!');
  });

  const { server } = app.listen({ host, port }, async () => {
    await rsbuildServer.afterListen();
  });

  // subscribe the server's http upgrade event to handle WebSocket upgrade
  server.on('upgrade', onHTTPUpgrade);

  return {
    config: rsbuildServer.config,
    close: async () => {
      await close();
      server.close();
    },
  };
}
