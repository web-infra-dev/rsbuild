import type { IncomingMessage, ServerResponse } from 'http';
import type { Socket } from 'net';
import { DevConfig, NextFunction, RequestHandler } from './config/dev';
import { ServerConfig } from './config/server';
import { Routes } from './hooks';
import type { RspackCompiler, RspackMultiCompiler } from './rspack';

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
  hmrClientPath?: string;
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

export type DevMiddlewaresConfig = Omit<
  DevConfig & ServerConfig,
  | 'beforeStartUrl'
  | 'progressBar'
  | 'startUrl'
  | 'https'
  | 'host'
  | 'port'
  | 'strictPort'
>;

export type RsbuildDevMiddlewareOptions = {
  pwd: string;
  dev: DevMiddlewaresConfig;
  devMiddleware?: DevMiddleware;
  output: {
    distPath: string;
    publicPaths: string[];
  };
};

export type StartServerResult = {
  urls: string[];
  port: number;
  server: {
    close: () => Promise<void>;
  };
};

export type UpgradeEvent = (
  req: IncomingMessage,
  socket: Socket,
  head: any,
) => void;

export type DevServerAPIs = {
  /**
   * The resolved rsbuild server config
   */
  config: {
    devServerConfig: DevConfig & ServerConfig;
    port: number;
    host: string;
    https: boolean;
    defaultRoutes: Routes;
  };
  /**
   * Trigger rsbuild onBeforeStartDevServer hook
   */
  beforeStart: () => Promise<void>;
  /**
   * Trigger rsbuild onAfterStartDevServer hook
   */
  afterStart: (options?: { port?: number; routes?: Routes }) => Promise<void>;
  /**
   * Get the corresponding builtin middleware according to the rsbuild config
   *
   * Related config: proxy / publicDir / historyApiFallback / headers / ...
   */
  getMiddlewares: (overrides?: RsbuildDevMiddlewareOptions['dev']) => Promise<{
    middlewares: RequestHandler[];
    close: () => Promise<void>;
    /**
     * Subscribe http upgrade event
     */
    onUpgrade: UpgradeEvent;
  }>;
};
