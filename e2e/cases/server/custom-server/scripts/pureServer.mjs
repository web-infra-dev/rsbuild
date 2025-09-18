import { createRsbuild } from '@rsbuild/core';
import polka from 'polka';

// Start custom dev server without compile
export async function startDevServerPure(fixtures) {
  const rsbuild = await createRsbuild({
    cwd: fixtures,
    rsbuildConfig: {
      server: {
        htmlFallback: false,
        middlewareMode: true,
      },
      dev: {
        setupMiddlewares: (middlewares) => {
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
      },
    },
  });

  const app = polka();

  const rsbuildServer = await rsbuild.createDevServer({ runCompile: false });

  app.get('/aaa', (_req, res) => {
    res.end('Hello World!');
  });

  app.use(rsbuildServer.middlewares);

  app.get('/bbb', (_req, res) => {
    res.end('Hello polka!');
  });

  const { server } = app.listen({ port: rsbuildServer.port }, async () => {
    await rsbuildServer.afterListen();
  });

  return {
    config: { port: rsbuildServer.port },
    close: async () => {
      await rsbuildServer.close();
      server.close();
    },
  };
}
