import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Socket } from 'node:net';
import type {
  DevMiddlewareAPI,
  NextFunction,
  ServerConfig,
  DevConfig,
  DevMiddleware as CustomDevMiddleware,
} from '@rsbuild/shared';
import { SocketServer } from './socketServer';

type Options = {
  publicPaths: string[];
  dev: DevConfig;
  server: ServerConfig;
  devMiddleware: CustomDevMiddleware;
};

const noop = () => {
  // noop
};

function getHMRClientPath(client: DevConfig['client'] = {}) {
  // host=localhost&port=3000&path=rsbuild-hmr
  const params = Object.entries(client).reduce((query, [key, value]) => {
    return value ? `${query}&${key}=${value}` : `${query}`;
  }, '');

  const clientEntry = `${require.resolve(
    '@rsbuild/core/client/hmr',
  )}?${params}`;

  // replace cjs with esm because we want to use the es5 version
  return clientEntry;
}

/**
 * Setup compiler-related logic:
 * 1. setup webpack-dev-middleware
 * 2. establish webSocket connect
 */
export class CompilerDevMiddleware {
  public middleware!: DevMiddlewareAPI;

  private devOptions: DevConfig;

  private serverOptions: ServerConfig;

  private devMiddleware: CustomDevMiddleware;

  private publicPaths: string[];

  private socketServer: SocketServer;

  constructor({ dev, server, devMiddleware, publicPaths }: Options) {
    this.devOptions = dev;
    this.serverOptions = server;
    this.publicPaths = publicPaths;

    // init socket server
    this.socketServer = new SocketServer(dev);

    this.devMiddleware = devMiddleware;
  }

  public init() {
    // start compiling
    this.middleware = this.setupDevMiddleware(
      this.devMiddleware,
      this.publicPaths,
    );

    this.socketServer.prepare();
  }

  public upgrade(req: IncomingMessage, sock: Socket, head: any) {
    this.socketServer.upgrade(req, sock, head);
  }

  public close() {
    // socketServer close should before app close
    this.socketServer.close();
    this.middleware?.close(noop);
  }

  public sockWrite(
    type: string,
    data?: Record<string, any> | string | boolean,
  ) {
    this.socketServer.sockWrite(type, data);
  }

  private setupDevMiddleware(
    devMiddleware: CustomDevMiddleware,
    publicPaths: string[],
  ): DevMiddlewareAPI {
    const { devOptions, serverOptions } = this;

    const callbacks = {
      onInvalid: () => {
        this.socketServer.sockWrite('invalid');
      },
      onDone: (stats: any) => {
        this.socketServer.updateStats(stats);
      },
    };

    const injectClient = this.devOptions.hmr || this.devOptions.liveReload;

    const middleware = devMiddleware({
      headers: serverOptions.headers,
      publicPath: '/',
      stats: false,
      callbacks,
      hmrClientPath: injectClient
        ? getHMRClientPath(devOptions.client)
        : undefined,
      serverSideRender: true,
      writeToDisk: devOptions.writeToDisk,
    });

    const warp = async (
      req: IncomingMessage,
      res: ServerResponse,
      next: NextFunction,
    ) => {
      const { url } = req;
      const assetPrefix =
        url && publicPaths.find((prefix) => url.startsWith(prefix));

      // slice publicPath, static asset have publicPath but html does not.
      if (assetPrefix && assetPrefix !== '/') {
        req.url = url.slice(assetPrefix.length - 1);

        middleware(req, res, (...args) => {
          req.url = url;
          next(...args);
        });
      } else {
        middleware(req, res, next);
      }
    };

    warp.close = middleware.close;

    // warp webpack-dev-middleware to handle html file（without publicPath）
    // maybe we should serve html file by sirv
    return warp;
  }
}
