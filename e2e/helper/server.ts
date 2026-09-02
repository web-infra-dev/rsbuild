import type { IncomingMessage, ServerResponse } from 'node:http';
import { RESPONSE_ALREADY_SENT } from '@hono/node-server/utils/response';
import type { RequestHandler } from '@rsbuild/core';
import type { Context } from 'hono';

export const createConnectHandler = (middlewares: RequestHandler) => {
  return ({ env }: Context) => {
    const incoming = env.incoming as IncomingMessage;
    const outgoing = env.outgoing as ServerResponse;

    middlewares(incoming, outgoing, (error) => {
      if (outgoing.writableEnded) {
        return;
      }
      outgoing.statusCode = error ? 500 : 404;
      outgoing.end(error ? String(error) : 'Not Found');
    });
    // Hono caches Response objects, so use a fresh sentinel for each request.
    return RESPONSE_ALREADY_SENT.clone();
  };
};
