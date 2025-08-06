import type { IncomingMessage } from 'node:http';
import type { Socket } from 'node:net';
import type Ws from '../../compiled/ws/index.js';
import {
  getAllStatsErrors,
  getAllStatsWarnings,
  getStatsOptions,
} from '../helpers';
import { formatStatsMessages } from '../helpers/format';
import { logger } from '../logger';
import type { DevConfig, EnvironmentContext, Rspack } from '../types';
import { genOverlayHTML } from './overlay';

interface ExtWebSocket extends Ws {
  isAlive: boolean;
}

function isEqualSet(a: Set<string>, b: Set<string>): boolean {
  return a.size === b.size && [...a].every((value) => b.has(value));
}

const CHECK_SOCKETS_INTERVAL = 30000;

export type SocketMessageStaticChanged = {
  type: 'static-changed' | 'content-changed';
};

export type SocketMessageHash = {
  type: 'hash';
  data: string;
};

export type SocketMessageOk = {
  type: 'ok';
};

export type SocketMessageWarnings = {
  type: 'warnings';
  data: { text: string[] };
};

export type SocketMessageErrors = {
  type: 'errors';
  data: { text: string[]; html: string };
};

export type SocketMessage =
  | SocketMessageOk
  | SocketMessageStaticChanged
  | SocketMessageHash
  | SocketMessageWarnings
  | SocketMessageErrors;

const parseQueryString = (req: IncomingMessage) => {
  const queryStr = req.url ? req.url.split('?')[1] : '';
  return queryStr ? Object.fromEntries(new URLSearchParams(queryStr)) : {};
};

export class SocketServer {
  private wsServer!: Ws.Server;

  private readonly sockets: Map<string, Ws> = new Map();

  private readonly options: DevConfig;

  private stats: Record<string, Rspack.Stats>;

  private initialChunks: Record<string, Set<string>>;

  private heartbeatTimer: NodeJS.Timeout | null = null;

  private environments: Record<string, EnvironmentContext>;

  constructor(
    options: DevConfig,
    environments: Record<string, EnvironmentContext>,
  ) {
    this.options = options;
    this.stats = {};
    this.initialChunks = {};
    this.environments = environments;
  }

  // subscribe upgrade event to handle socket
  public upgrade = (
    req: IncomingMessage,
    socket: Socket,
    head: Buffer,
  ): void => {
    if (!this.wsServer.shouldHandle(req)) {
      return;
    }

    const query = parseQueryString(req);
    const tokens = Object.values(this.environments).map(
      (env) => env.webSocketToken,
    );

    // If the request does not contain a valid token, reject the request.
    if (!tokens.includes(query.token)) {
      socket.destroy();
      return;
    }

    this.wsServer.handleUpgrade(req, socket, head, (connection) => {
      this.wsServer.emit('connection', connection, req);
    });
  };

  // detect and close broken connections
  // https://github.com/websockets/ws/blob/8.18.0/README.md#how-to-detect-and-close-broken-connections
  private checkSockets = () => {
    for (const socket of this.wsServer.clients) {
      const extWs = socket as ExtWebSocket;
      if (!extWs.isAlive) {
        extWs.terminate();
      } else {
        extWs.isAlive = false;
        extWs.ping(() => {
          // empty
        });
      }
    }

    // Schedule next check only if timer hasn't been cleared
    if (this.heartbeatTimer !== null) {
      this.heartbeatTimer = setTimeout(
        this.checkSockets,
        CHECK_SOCKETS_INTERVAL,
      ).unref();
    }
  };

  private clearHeartbeatTimer(): void {
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // create socket, install socket handler, bind socket event
  public async prepare(): Promise<void> {
    this.clearHeartbeatTimer();

    const { default: ws } = await import('../../compiled/ws/index.js');

    this.wsServer = new ws.Server({
      noServer: true,
      path: this.options.client?.path,
    });

    this.wsServer.on('error', (err: Error) => {
      // only dev server, use default logger
      logger.error(err);
    });

    this.heartbeatTimer = setTimeout(
      this.checkSockets,
      CHECK_SOCKETS_INTERVAL,
    ).unref();

    this.wsServer.on('connection', (socket, req) => {
      // /rsbuild-hmr?token=...
      const query = parseQueryString(req);

      this.onConnect(socket, query.token);
    });
  }

  public updateStats(stats: Rspack.Stats, token: string): void {
    this.stats[token] = stats;

    if (!this.sockets.size) {
      return;
    }

    this.sendStats({
      token,
    });
  }

  /**
   * Write message to each socket
   * @param message - The message to send
   * @param token - The token of the socket to send the message to,
   * if not provided, the message will be sent to all sockets
   */
  public sockWrite(message: SocketMessage, token?: string): void {
    const messageStr = JSON.stringify(message);
    if (token) {
      const socket = this.sockets.get(token);
      if (socket) {
        this.send(socket, messageStr);
      }
    } else {
      for (const socket of this.sockets.values()) {
        this.send(socket, messageStr);
      }
    }
  }

  public async close(): Promise<void> {
    this.clearHeartbeatTimer();

    // Remove all event listeners
    this.wsServer.removeAllListeners();

    // Close all client sockets
    for (const socket of this.wsServer.clients) {
      socket.terminate();
    }
    // Close all tracked sockets
    for (const socket of this.sockets.values()) {
      socket.close();
    }

    // Reset all properties
    this.stats = {};
    this.initialChunks = {};
    this.sockets.clear();

    return new Promise<void>((resolve, reject) => {
      this.wsServer.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  private onConnect(socket: Ws, token: string) {
    const connection = socket as ExtWebSocket;

    connection.isAlive = true;

    // heartbeat
    connection.on('pong', () => {
      connection.isAlive = true;
    });

    this.sockets.set(token, connection);

    connection.on('close', () => {
      this.sockets.delete(token);
    });

    // send first stats to active client sock if stats exist
    if (this.stats) {
      this.sendStats({
        force: true,
        token,
      });
    }
  }

  // get standard stats
  private getStats(name: string) {
    const curStats = this.stats[name];

    if (!curStats) {
      return null;
    }

    const defaultStats: Record<string, boolean> = {
      all: false,
      hash: true,
      assets: true,
      warnings: true,
      warningsCount: true,
      errors: true,
      errorsCount: true,
      errorDetails: false,
      entrypoints: true,
      children: true,
      moduleTrace: true,
    };

    const statsOptions = getStatsOptions(curStats.compilation.compiler);
    const statsJson = curStats.toJson({ ...defaultStats, ...statsOptions });

    // statsJson is null when the previous compilation is removed on the Rust side
    if (!statsJson) {
      return null;
    }

    return {
      statsJson,
      root: curStats.compilation.compiler.options.context,
    };
  }

  // determine what message should send by stats
  private sendStats({
    force = false,
    token,
  }: {
    token: string;
    force?: boolean;
  }) {
    const result = this.getStats(token);

    // this should never happened
    if (!result) {
      return null;
    }

    const { statsJson, root } = result;

    // web-infra-dev/rspack#6633
    // when initial-chunks change, reload the page
    // e.g: ['index.js'] -> ['index.js', 'lib-polyfill.js']
    const newInitialChunks: Set<string> = new Set();
    if (statsJson.entrypoints) {
      for (const entrypoint of Object.values(statsJson.entrypoints)) {
        const chunks = entrypoint.chunks;

        if (!Array.isArray(chunks)) {
          continue;
        }

        for (const chunkName of chunks) {
          if (!chunkName) {
            continue;
          }
          newInitialChunks.add(String(chunkName));
        }
      }
    }

    const initialChunks = this.initialChunks[token];
    const shouldReload =
      Boolean(statsJson.entrypoints) &&
      Boolean(initialChunks) &&
      !isEqualSet(initialChunks, newInitialChunks);

    this.initialChunks[token] = newInitialChunks;

    if (shouldReload) {
      this.sockWrite({ type: 'static-changed' }, token);
      return;
    }

    const shouldEmit =
      !force &&
      statsJson &&
      !statsJson.errorsCount &&
      statsJson.assets &&
      statsJson.assets.every((asset: any) => !asset.emitted);

    if (shouldEmit) {
      this.sockWrite({ type: 'ok' }, token);
      return;
    }

    if (statsJson.hash) {
      this.sockWrite(
        {
          type: 'hash',
          data: statsJson.hash,
        },
        token,
      );
    }

    if (statsJson.errorsCount) {
      const errors = getAllStatsErrors(statsJson);
      const { errors: formattedErrors } = formatStatsMessages({
        errors,
        warnings: [],
      });

      this.sockWrite(
        {
          type: 'errors',
          data: {
            text: formattedErrors,
            html: genOverlayHTML(formattedErrors, root),
          },
        },
        token,
      );
      return;
    }

    if (statsJson.warningsCount) {
      const warnings = getAllStatsWarnings(statsJson);
      const { warnings: formattedWarnings } = formatStatsMessages({
        warnings,
        errors: [],
      });
      this.sockWrite(
        {
          type: 'warnings',
          data: {
            text: formattedWarnings,
          },
        },
        token,
      );
      return;
    }

    this.sockWrite({ type: 'ok' }, token);
    return;
  }

  // send message to connecting socket
  private send(connection: Ws, message: string) {
    if (connection.readyState !== 1) {
      return;
    }

    connection.send(message);
  }
}
