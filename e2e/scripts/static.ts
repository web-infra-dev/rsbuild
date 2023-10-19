import http from 'http';
import getPort from 'get-port';
import createServer from 'connect';
import serveStaticImpl from 'serve-static';

export type ServeStaticOptions<
  R extends http.ServerResponse = http.ServerResponse,
> = serveStaticImpl.ServeStaticOptions<R>;

function serveStaticMiddle<R extends http.ServerResponse>(
  root: string,
  options?: ServeStaticOptions<R>,
): serveStaticImpl.RequestHandler<R> {
  return serveStaticImpl(root, options);
}

export interface StaticServerOptions {
  hostname?: string;
  port?: number;
}

export async function runStaticServer(
  root: string,
  options?: StaticServerOptions,
) {
  const server = createServer();

  server.use(serveStaticMiddle(root));

  const port = await getPort({ port: options?.port || 8080 });
  const hostname = options?.hostname ?? '127.0.0.1';
  const listener = server.listen(port, hostname);

  return { port, hostname, close: () => listener.close() };
}
