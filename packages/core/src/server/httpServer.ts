import type { Server } from 'node:http';
import type { Http2SecureServer } from 'node:http2';
import type { Connect, ServerConfig } from '../types';

export const createHttpServer = async ({
  serverConfig,
  middlewares,
}: {
  serverConfig: ServerConfig;
  middlewares: Connect.Server;
}): Promise<Http2SecureServer | Server> => {
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
