import { createRsbuild } from '@rsbuild/core';
import polka from 'polka';

export async function startDevServer(fixtures) {
  const rsbuild = await createRsbuild({
    cwd: fixtures,
    rsbuildConfig: {
      server: {
        htmlFallback: false,
        middlewareMode: true,
      },
    },
  });

  const app = polka();

  const rsbuildServer = await rsbuild.createDevServer();

  const { middlewares, close, port } = rsbuildServer;

  app.get('/aaa', (_req, res) => {
    res.end('Hello World!');
  });

  app.use(middlewares);

  app.get('/bbb', (_req, res) => {
    res.end('Hello polka!');
  });

  const { server } = app.listen({ port }, async () => {
    await rsbuildServer.afterListen();
  });

  rsbuildServer.connectWebSocket({ server });

  return {
    config: { port },
    close: async () => {
      await close();
      server.close();
    },
  };
}
