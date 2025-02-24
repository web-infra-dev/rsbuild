import type { IncomingMessage, ServerResponse } from 'node:http';
import { createRequire } from 'node:module';
import type { Socket } from 'node:net';
import { HTML_REGEX } from '../constants';
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
  const writeToDiskValues = Object.values(environments).map(
    (env) => env.config.dev.writeToDisk,
  );
  if (new Set(writeToDiskValues).size === 1) {
    return {
      ...config,
      writeToDisk: writeToDiskValues[0],
    };
  }

  return {
    ...config,
    writeToDisk(filePath: string, compilationName?: string) {
      let { writeToDisk } = config;
      if (compilationName && environments[compilationName]) {
        writeToDisk =
          environments[compilationName].config.dev.writeToDisk ?? writeToDisk;
      }
      return typeof writeToDisk === 'function'
        ? writeToDisk(filePath)
        : writeToDisk!;
    },
  };
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
    this.middleware = await this.setupDevMiddleware(
      devMiddleware,
      this.publicPaths,
    );
    await this.socketServer.prepare();
  }

  public upgrade(req: IncomingMessage, sock: Socket, head: any): void {
    this.socketServer.upgrade(req, sock, head);
  }

  public async close(): Promise<void> {
    // socketServer close should before app close
    await this.socketServer.close();

    if (this.middleware) {
      await new Promise<void>((resolve) => {
        this.middleware.close(() => {
          resolve();
        });
      });
    }

    // `middleware.close()` only stop watching for file changes, compiler should also be closed.
    await new Promise<void>((resolve) => {
      this.compiler.close(() => {
        resolve();
      });
    });
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

  private async setupDevMiddleware(
    devMiddleware: CustomDevMiddleware,
    publicPaths: string[],
  ): Promise<DevMiddlewareAPI> {
    const { devConfig, serverConfig } = this;
    const { headers, base } = serverConfig;

    const callbacks = {
      onInvalid: (compilationId?: string, fileName?: string | null) => {
        // reload page when HTML template changed
        if (typeof fileName === 'string' && HTML_REGEX.test(fileName)) {
          this.socketServer.sockWrite({
            type: 'static-changed',
            compilationId,
          });
          return;
        }

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

    const middleware = await devMiddleware({
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
      serverConfig,
    });

    const assetPrefixes = publicPaths
      .map(pathnameParse)
      .map((prefix) =>
        base && base !== '/' ? stripBase(prefix, base) : prefix,
      );

    const wrapper = async (
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

    wrapper.close = middleware.close;

    // wrap rsbuild-dev-middleware to handle HTML file（without publicPath）
    // maybe we should serve HTML file by sirv
    return wrapper;
  }
}
