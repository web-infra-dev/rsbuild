import type { IncomingMessage } from 'node:http';
import type { Socket } from 'node:net';
import type Connect from '../../compiled/connect/index.js';

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
  middlewares: Connect.Server;
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
