import type { ServerConfig } from '@rsbuild/shared';
import type Connect from '../../compiled/connect/index.js';

export const createHttpServer = async ({
  serverConfig,
  middlewares,
}: {
  serverConfig: ServerConfig;
  middlewares: Connect.Server;
}) => {
  if (serverConfig.https) {
    // http-proxy does not supports http2
    if (serverConfig.proxy) {
      const { createServer } = await import('node:https');
      return createServer(serverConfig.https, middlewares);
    }

    const { createSecureServer } = await import('node:http2');
    return createSecureServer(
      {
        allowHTTP1: true,
        // increase the maximum memory (MiB)
        maxSessionMemory: 1024,
        ...serverConfig.https,
      },
      // @ts-expect-error req type mismatch
      middlewares,
    );
  }

  const { createServer } = await import('node:http');
  return createServer(middlewares);
};
