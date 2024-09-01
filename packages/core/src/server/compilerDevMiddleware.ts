import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Socket } from 'node:net';
import { pathnameParse } from '../helpers/path';
import type { DevConfig, NextFunction, Rspack, ServerConfig } from '../types';
import {
  type DevMiddleware as CustomDevMiddleware,
  type DevMiddlewareAPI,
  getDevMiddleware,
} from './devMiddleware';
import { SocketServer } from './socketServer';

type Options = {
  publicPaths: string[];
  dev: DevConfig;
  server: ServerConfig;
  compiler: Rspack.Compiler | Rspack.MultiCompiler;
};

const noop = () => {
  // noop
};

function getClientPaths(devConfig: DevConfig) {
  const clientPaths: string[] = [];

  if (!devConfig.hmr && !devConfig.liveReload) {
    return clientPaths;
  }

  clientPaths.push(require.resolve('@rsbuild/core/client/hmr'));

  if (devConfig.client?.overlay) {
    clientPaths.push(`${require.resolve('@rsbuild/core/client/overlay')}`);
  }

  return clientPaths;
}

/**
 * Setup compiler-related logic:
 * 1. setup rsbuild-dev-middleware
 * 2. establish webSocket connect
 */
export class CompilerDevMiddleware {
  public middleware!: DevMiddlewareAPI;

  private devConfig: DevConfig;

  private serverConfig: ServerConfig;

  private compiler: Rspack.Compiler | Rspack.MultiCompiler;

  private publicPaths: string[];

  private socketServer: SocketServer;

  constructor({ dev, server, compiler, publicPaths }: Options) {
    this.devConfig = dev;
    this.serverConfig = server;
    this.compiler = compiler;
    this.publicPaths = publicPaths;

    // init socket server
    this.socketServer = new SocketServer(dev);
  }

  public async init(): Promise<void> {
    // start compiling
    const devMiddleware = await getDevMiddleware(this.compiler);
    this.middleware = this.setupDevMiddleware(devMiddleware, this.publicPaths);
    await this.socketServer.prepare();
  }

  public upgrade(req: IncomingMessage, sock: Socket, head: any): void {
    this.socketServer.upgrade(req, sock, head);
  }

  public close(): void {
    // socketServer close should before app close
    this.socketServer.close();
    this.middleware?.close(noop);
  }

  public sockWrite(
    type: string,
    data?: Record<string, any> | string | boolean,
  ): void {
    this.socketServer.sockWrite({
      type,
      data,
    });
  }

  private setupDevMiddleware(
    devMiddleware: CustomDevMiddleware,
    publicPaths: string[],
  ): DevMiddlewareAPI {
    const { devConfig, serverConfig } = this;

    const callbacks = {
      onInvalid: (compilationName?: string) => {
        this.socketServer.sockWrite({
          type: 'invalid',
          compilationName,
        });
      },
      onDone: (stats: any) => {
        this.socketServer.updateStats(stats);
      },
    };

    const clientPaths = getClientPaths(devConfig);

    const middleware = devMiddleware({
      headers: serverConfig.headers,
      publicPath: '/',
      stats: false,
      callbacks,
      clientPaths: clientPaths,
      clientConfig: devConfig.client,
      liveReload: devConfig.liveReload,
      writeToDisk: devConfig.writeToDisk,
      serverSideRender: true,
      // weak is enough in dev
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Conditional_requests#weak_validation
      etag: 'weak',
    });

    const assetPrefixes = publicPaths.map(pathnameParse);

    const warp = async (
      req: IncomingMessage,
      res: ServerResponse,
      next: NextFunction,
    ) => {
      const { url } = req;
      const assetPrefix =
        url && assetPrefixes.find((prefix) => url.startsWith(prefix));

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

    // warp rsbuild-dev-middleware to handle html file（without publicPath）
    // maybe we should serve html file by sirv
    return warp;
  }
}
