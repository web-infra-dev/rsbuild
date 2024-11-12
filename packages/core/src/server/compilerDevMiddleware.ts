import type { IncomingMessage, ServerResponse } from 'node:http';
import { createRequire } from 'node:module';
import type { Socket } from 'node:net';
import { pathnameParse } from '../helpers/path';
import type {
  EnvironmentContext,
  NextFunction,
  DevConfig as OriginDevConfig,
  Rspack,
  ServerConfig,
} from '../types';
import {
  type DevMiddleware as CustomDevMiddleware,
  type DevMiddlewareAPI,
  getDevMiddleware,
} from './devMiddleware';
import { stripBase } from './helper';
import { SocketServer } from './socketServer';

const require = createRequire(import.meta.url);

type Options = {
  publicPaths: string[];
  environments: Record<string, EnvironmentContext>;
  dev: OriginDevConfig;
  server: ServerConfig;
  compiler: Rspack.Compiler | Rspack.MultiCompiler;
};

type DevConfig = Omit<OriginDevConfig, 'writeToDisk'> & {
  writeToDisk?:
    | boolean
    | ((filename: string, compilationName?: string) => boolean);
};

// allow to configure dev.writeToDisk in environments
const formatDevConfig = (
  config: OriginDevConfig,
  environments: Record<string, EnvironmentContext>,
): DevConfig => {
  const newDevConfig: DevConfig = { ...config };
  const defaultWriteToDisk = config.writeToDisk;

  const values = Object.values(environments).map(
    (e) => e.config.dev.writeToDisk,
  );

  const isSame =
    values.every((v) => v === true) || values.every((v) => v === false);

  if (isSame) {
    newDevConfig.writeToDisk = values[0];
  } else {
    newDevConfig.writeToDisk = (filePath, compilationName) => {
      let writeToDisk = defaultWriteToDisk;

      if (compilationName && environments[compilationName]) {
        writeToDisk =
          environments[compilationName].config.dev.writeToDisk ??
          defaultWriteToDisk;
      }

      return typeof writeToDisk === 'function'
        ? writeToDisk(filePath)
        : writeToDisk!;
    };
  }

  return newDevConfig;
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

  constructor({ dev, server, compiler, publicPaths, environments }: Options) {
    this.devConfig = formatDevConfig(dev, environments);
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
    const {
      devConfig,
      serverConfig: { headers, base },
    } = this;

    const callbacks = {
      onInvalid: (compilationId?: string) => {
        this.socketServer.sockWrite({
          type: 'invalid',
          compilationId,
        });
      },
      onDone: (stats: any) => {
        this.socketServer.updateStats(stats);
      },
    };

    const clientPaths = getClientPaths(devConfig);

    const middleware = devMiddleware({
      headers,
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

    const assetPrefixes = publicPaths
      .map(pathnameParse)
      .map((prefix) =>
        base && base !== '/' ? stripBase(prefix, base) : prefix,
      );

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
