import type { IncomingMessage, ServerResponse, Server } from 'http';
import { DevConfig, NextFunction } from './config/dev';
import type { Logger } from '../logger';
// import type Connect from 'connect';
// import type { ListenOptions } from 'net';

type Middleware = (
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

export type RsbuildDevServerOptions = {
  pwd: string;
  dev: DevConfig;
  devMiddleware?: DevMiddleware;
};

export type CreateDevServerOptions = {
  server?: {
    customApp?: Server;
    logger?: Logger;
  };
} & RsbuildDevServerOptions;

export type ServerApi = {
  // middlewares: Connect.Server;
  // logger: Logger;
  // listen: (
  //   options?: number | ListenOptions,
  //   cb?: (err: Error) => Promise<void>,
  // ) => void;
  close: () => void;
};

export type StartServerResult = {
  urls: string[];
  port: number;
  server: ServerApi;
};
