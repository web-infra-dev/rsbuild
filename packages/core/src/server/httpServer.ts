import type { ServerConfig } from '@rsbuild/shared';
import type connect from '@rsbuild/shared/connect';

export const createHttpServer = async (options: {
  https?: ServerConfig['https'];
  middlewares: connect.Server;
}) => {
  if (options.https) {
    const { createServer } = await import('https');
    return createServer(options.https, options.middlewares);
  }

  const { createServer } = await import('http');
  return createServer(options.middlewares);
};
