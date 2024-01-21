import type { IncomingMessage, ServerResponse } from 'http';
import type { Socket } from 'net';
import type {
  DevConfig,
  NextFunction,
  RequestHandler,
  ServerAPIs,
} from './config/dev';
import type { ServerConfig } from './config/server';
import type { Routes } from './hooks';
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
   * Trigger rsbuild compile
   */
  startCompile: () => Promise<CompileMiddlewareAPI>;
  /**
   * Trigger rsbuild onBeforeStartDevServer hook
   *
   * It should called before listen and after compile
   */
  beforeStart: () => Promise<void>;
  /**
   * Trigger rsbuild onAfterStartDevServer hook
   *
   * It should called after listen
   */
  afterStart: (options?: { port?: number; routes?: Routes }) => Promise<void>;
  /**
   * Get the corresponding builtin middleware according to the rsbuild config
   *
   * Related config: proxy / publicDir / historyApiFallback / headers / ...
   */
  getMiddlewares: (options?: {
    compileMiddlewareAPI?: CompileMiddlewareAPI;
    /**
     * Overrides middleware configs
     *
     * By default, get config from rsbuild dev.xxx and server.xxx
     */
    overrides?: DevMiddlewaresConfig;
  }) => Promise<{
    middlewares: Middlewares;
    close: () => Promise<void>;
    /**
     * Subscribe http upgrade event
     */
    onUpgrade: UpgradeEvent;
  }>;
};
