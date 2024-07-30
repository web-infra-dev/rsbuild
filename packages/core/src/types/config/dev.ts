import type { IncomingMessage, ServerResponse } from 'node:http';
import type { WatchOptions } from 'chokidar';
import type { Rspack } from '../rspack';
import type { Stats } from '../stats';

export type ProgressBarConfig = {
  id?: string;
};

export type NextFunction = () => void;

export type RequestHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  next: NextFunction,
) => void;

export type EnvironmentAPI = {
  [name: string]: {
    /**
     * Get stats info about current environment.
     */
    getStats: () => Promise<Stats>;

    /**
     * Load and execute stats bundle in Server.
     *
     * @param entryName - relate to rsbuild source.entry
     * @returns the return of entry module.
     */
    loadBundle: <T = unknown>(entryName: string) => Promise<T>;

    /**
     * Get the compiled HTML template.
     */
    getTransformedHtml: (entryName: string) => Promise<string>;
  };
};

export type ServerAPIs = {
  sockWrite: (
    type: string,
    data?: string | boolean | Record<string, any>,
  ) => void;
  environments: EnvironmentAPI;
};

export type ClientConfig = {
  path?: string;
  port?: string | number;
  host?: string;
  protocol?: 'ws' | 'wss';
  /** Shows an overlay in the browser when there are compiler errors. */
  overlay?: boolean;
};

export type ChokidarWatchOptions = WatchOptions;

export type WatchFiles = {
  paths: string | string[];
  options?: WatchOptions;
  type?: 'reload-page' | 'reload-server';
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
   * Set the URL prefix of static assets during development,
   * similar to the [output.publicPath](https://rspack.dev/config/output#outputpublicpath) config of webpack.
   */
  assetPrefix?: string | boolean;
  /**
   * Whether to display progress bar during compilation.
   */
  progressBar?: boolean | ProgressBarConfig;
  /**
   * Config for Rsbuild client code.
   */
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
  Required<
    Pick<
      DevConfig,
      'hmr' | 'client' | 'liveReload' | 'assetPrefix' | 'writeToDisk'
    >
  >;
