import { RESPONSE_ALREADY_SENT } from '@hono/node-server/utils/response';
import type { RequestHandler } from '@rsbuild/core';
import type { Context } from 'hono';

export const createConnectHandler = (middlewares: RequestHandler) => {
  return (c: Context) => {
    middlewares(c.env.incoming, c.env.outgoing, (error) => {
      if (c.env.outgoing.writableEnded) {
        return;
      }
      c.env.outgoing.statusCode = error ? 500 : 404;
      c.env.outgoing.end(error ? String(error) : 'Not Found');
    });
    return RESPONSE_ALREADY_SENT;
  };
};
