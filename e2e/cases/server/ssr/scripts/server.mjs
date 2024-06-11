import fs from 'node:fs';
import path from 'node:path';
import { createRsbuild, logger } from '@rsbuild/core';
import { loadConfig } from '@rsbuild/core';
import polka from 'polka';

export const serverRender = (rsbuildServer) => async (_req, res, _next) => {
  const indexModule = await rsbuildServer.ssrLoadModule('index');

  const markup = indexModule.render();

  const template = await rsbuildServer.getTransformedHtml('index');

  const html = template.replace('<!--app-content-->', markup);

  res.writeHead(200, {
    'Content-Type': 'text/html',
  });
  res.end(html);
};

export async function startDevServer(fixtures, overridsConfig) {
  process.env.NODE_ENV = 'development';

  const { content } = overridsConfig
    ? { content: overridsConfig }
    : await loadConfig({
        cwd: fixtures,
      });

  const rsbuild = await createRsbuild({
    cwd: fixtures,
    rsbuildConfig: content,
  });

  const app = polka();

  const rsbuildServer = await rsbuild.createDevServer();

  const serverRenderMiddleware = serverRender(rsbuildServer);

  app.use('/', async (req, res, next) => {
    if (req.method === 'GET' && req.url === '/') {
      try {
        await serverRenderMiddleware(req, res, next);
      } catch (err) {
        logger.error('ssr render error, downgrade to csr...\n', err);
        next();
      }
    } else {
      next();
    }
  });

  app.use(rsbuildServer.middlewares);

  const { port } = rsbuildServer;

  const { server } = app.listen({ port }, async () => {
    await rsbuildServer.afterListen();
  });

  // subscribe the server's http upgrade event to handle WebSocket upgrade
  server.on('upgrade', rsbuildServer.onHTTPUpgrade);

  return {
    config: { port },
    close: async () => {
      await rsbuildServer.close();
      server.close();
    },
  };
}
