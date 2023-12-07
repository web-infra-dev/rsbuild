import type { ServerConfig } from '@rsbuild/shared';
import type connect from '@rsbuild/shared/connect';

export const createHttpServer = async (options: {
  https?: ServerConfig['https'];
  middlewares: connect.Server;
}) => {
  let app;
  if (options.https) {
    const { createServer } = await import('https');
    app = createServer(options.https, options.middlewares);
  } else {
    const { createServer } = await import('http');
    app = createServer(options.middlewares);
  }

  return app;
};
