import type { HttpBindings } from '@hono/node-server';
import { RESPONSE_ALREADY_SENT } from '@hono/node-server/utils/response';
import type { RequestHandler } from '@rsbuild/core';
import type { Context } from 'hono';

export const createConnectHandler = (middlewares: RequestHandler) => {
  return ({ env }: Context<{ Bindings: HttpBindings }>) => {
    const incoming = env.incoming;
    const outgoing = env.outgoing;

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
