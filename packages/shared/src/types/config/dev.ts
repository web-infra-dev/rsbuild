import type { ArrayOrNot } from '../utils';
import type { IncomingMessage, ServerResponse } from 'http';

export type ProgressBarConfig = {
  id?: string;
};

export type NextFunction = () => void;

export type RequestHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  next: NextFunction,
) => void;

export type ExposeServerApis = {
  sockWrite: (
    type: string,
    data?: string | boolean | Record<string, any>,
  ) => void;
};

export interface DevConfig {
  /**
   * Whether to enable Hot Module Replacement.
   */
  hmr?: boolean;
  /**
   * Used to set the page URL to open automatically when the Dev Server starts.
   * By default, no page will be opened.
   */
  startUrl?: boolean | string | string[];
  /**
   * Used to execute a callback function before opening the `startUrl`.
   * This config needs to be used together with `dev.startUrl`.
   */
  beforeStartUrl?: ArrayOrNot<() => Promise<void> | void>;
  /**
   * Set the URL prefix of static assets in the development environment,
   * similar to the [output.publicPath](https://webpack.js.org/guides/public-path/) config of webpack.
   */
  assetPrefix?: string | boolean;
  /**
   * Whether to display progress bar during compilation.
   */
  progressBar?: boolean | ProgressBarConfig;

  /** config of hmr client. */
  client?: {
    path?: string;
    port?: string;
    host?: string;
    protocol?: string;
  };
  /** Whether to enable gzip compression */
  compress?: boolean;
  /** see https://github.com/webpack/webpack-dev-middleware */
  devMiddleware?: {
    writeToDisk?: boolean | ((filename: string) => boolean);
    outputFileSystem?: Record<string, any>;
  };
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
      server: ExposeServerApis,
    ) => void
  >;
}

export type NormalizedDevConfig = DevConfig &
  Required<Pick<DevConfig, 'hmr' | 'startUrl' | 'assetPrefix'>>;
