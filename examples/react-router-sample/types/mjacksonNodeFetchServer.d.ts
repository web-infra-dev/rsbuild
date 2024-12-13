declare module '@mjackson/node-fetch-server' {
  import type { RequestListener } from 'node:http';

  export function createRequestListener(
    handler: (request: Request) => Promise<Response> | Response,
  ): RequestListener;
}
