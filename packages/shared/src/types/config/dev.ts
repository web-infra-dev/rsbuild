import type { IncomingMessage, ServerResponse } from 'node:http';
import type { WatchOptions } from '../../../compiled/chokidar/index.js';
import type { Rspack } from '../rspack';
import type { OneOrMany } from '../utils';

export type ProgressBarConfig = {
  id?: string;
};

export type NextFunction = () => void;

export type RequestHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  next: NextFunction,
) => void;

export type ServerAPIs = {
  sockWrite: (
    type: string,
    data?: string | boolean | Record<string, any>,
  ) => void;
};

export type ClientConfig = {
  path?: string;
  port?: string;
  host?: string;
  protocol?: 'ws' | 'wss';
  /** Shows an overlay in the browser when there are compiler errors. */
  overlay?: boolean;
};

export type ChokidarWatchOptions = WatchOptions;

export type WatchFiles = {
  paths: string | string[];
  options?: WatchOptions;
};

export interface DevConfig {
  /**
   * Whether to enable Hot Module Replacement.
   */
  hmr?: boolean;
  /**
   * Whether to reload the page when file changes are detected.
   */
  liveReload?: boolean;
  /**
   * Set the page URL to open when the server starts.
   * @deprecated use `server.open` instead
   */
  startUrl?: boolean | string | string[];
  /**
   * Used to execute a callback function before opening the `startUrl`.
   * This config needs to be used together with `dev.startUrl`.
   */
  beforeStartUrl?: OneOrMany<() => Promise<void> | void>;
  /**
   * Set the URL prefix of static assets during development,
   * similar to the [output.publicPath](https://rspack.dev/config/output#outputpublicpath) config of webpack.
   */
  assetPrefix?: string | boolean;
  /**
   * Whether to display progress bar during compilation.
   */
  progressBar?: boolean | ProgressBarConfig;
  /** config of Rsbuild client code. */
  client?: ClientConfig;
  /** Provides the ability to execute a custom function and apply custom middlewares */
  setupMiddlewares?: Array<
    (
      /** Order: `unshift` => internal middlewares => `push` */
      middlewares: {
        /** Use the `unshift` method if you want to run a middleware before all other middlewares */
        unshift: (...handlers: RequestHandler[]) => void;
        /** Use the `push` method if you want to run a middleware after all other middlewares */
        push: (...handlers: RequestHandler[]) => void;
      },
      server: ServerAPIs,
    ) => void
  >;
  /**
   * Used to control whether the build artifacts of the development environment are written to the disk.
   */
  writeToDisk?: boolean | ((filename: string) => boolean);
  /**
   * This option allows you to configure a list of globs/directories/files to watch for file changes.
   */
  watchFiles?: WatchFiles;
  /**
   * Enable lazy compilation.
   */
  lazyCompilation?: boolean | Rspack.LazyCompilationOptions;
}

export type NormalizedDevConfig = DevConfig &
  Required<Pick<DevConfig, 'hmr' | 'liveReload' | 'startUrl' | 'assetPrefix'>>;
