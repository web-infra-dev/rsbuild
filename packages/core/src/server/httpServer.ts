import type { Server } from 'node:http';
import defer * as http from 'node:http';
import type { Http2SecureServer } from 'node:http2';
import defer * as http2 from 'node:http2';
import defer * as https from 'node:https';
import type { Connect, ServerConfig } from '../types';

export const createHttpServer = ({
  serverConfig,
  middlewares,
}: {
  serverConfig: ServerConfig;
  middlewares: Connect.Server;
}): Http2SecureServer | Server => {
  if (serverConfig.https) {
    // http-proxy does not supports http2
    if (serverConfig.proxy) {
      return https.createServer(serverConfig.https, middlewares);
    }

    return http2.createSecureServer(
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

  return http.createServer(middlewares);
};
