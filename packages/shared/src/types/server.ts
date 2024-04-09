import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Socket } from 'node:net';
import type { NextFunction, RequestHandler, ServerAPIs, DevConfig } from './config/dev';
import type { RspackCompiler, RspackMultiCompiler } from './rspack';
import type { Server as ConnectServer } from '../../compiled/connect';

export type Middleware = (
  req: IncomingMessage,
  res: ServerResponse,
  next: NextFunction,
) => Promise<void>;

export type DevMiddlewareAPI = Middleware & {
  close: (callback: (err: Error | null | undefined) => void) => any;
};

export type MiddlewareCallbacks = {
  onInvalid: () => void;
  onDone: (stats: any) => void;
};

export type DevMiddlewareOptions = {
  /** To ensure HMR works, the devMiddleware need inject the hmr client path into page when HMR enable. */
  hmrClientPaths?: string[];
  RSBUILD_HMR_OPTIONS: DevConfig['client'];
  publicPath?: string;

  /** The options need by compiler middleware (like webpackMiddleware) */
  headers?: Record<string, string | string[]>;
  writeToDisk?: boolean | ((filename: string) => boolean);
  stats?: boolean;

  /** should trigger when compiler hook called */
  callbacks: MiddlewareCallbacks;

  /** whether use Server Side Render */
  serverSideRender?: boolean;
};

/**
 * The rsbuild/server do nothing about compiler, the devMiddleware need do such things to ensure dev works well:
 * - Call compiler.watch （normally did by webpack-dev-middleware）.
 * - Inject the hmr client path into page （the hmr client rsbuild/server already provide）.
 * - Notify server when compiler hooks are triggered.
 */
export type DevMiddleware = (options: DevMiddlewareOptions) => DevMiddlewareAPI;

export type CreateDevMiddlewareReturns = {
  devMiddleware: (options: DevMiddlewareOptions) => DevMiddlewareAPI;
  compiler: RspackCompiler | RspackMultiCompiler;
};

export type StartServerResult = {
  urls: string[];
  port: number;
  server: {
    close: () => Promise<void>;
  };
};

/**
 * It used to subscribe http upgrade event
 */
export type UpgradeEvent = (
  req: IncomingMessage,
  socket: Socket,
  head: any,
) => void;

export type CompileMiddlewareAPI = {
  middleware: RequestHandler;
  sockWrite: ServerAPIs['sockWrite'];
  onUpgrade: UpgradeEvent;
  close: () => void;
};

export type Middlewares = Array<RequestHandler | [string, RequestHandler]>;

export type RsbuildDevServer = {
  /**
   * Use rsbuild inner server to listen
   */
  listen: () => Promise<{
    port: number;
    urls: string[];
    server: {
      close: () => Promise<void>;
    };
  }>;

  /** The following APIs will be used when you use a custom server */

  /**
   * The resolved port.
   *
   * By default, Rsbuild Server listens on port `3000` and automatically increments the port number when the port is occupied.
   */
  port: number;
  /**
   * connect app instance.
   *
   * Can be used to attach custom middlewares to the dev server.
   */
  middlewares: ConnectServer;
  /**
   * Notify Rsbuild Server has started
   *
   * In Rsbuild, we will trigger onAfterStartDevServer hook in this stage
   */
  afterListen: () => Promise<void>;
  /**
   * Subscribe http upgrade event
   *
   * It will used when you use custom server
   */
  onHTTPUpgrade: UpgradeEvent;
  /**
   * Close the Rsbuild server.
   */
  close: () => Promise<void>;
};
