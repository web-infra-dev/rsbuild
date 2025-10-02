import type { IncomingMessage } from 'node:http';
import type { Socket } from 'node:net';
import type Ws from '../../compiled/ws/index.js';
import { formatStatsError } from '../helpers/format';
import { getStatsErrors, getStatsWarnings } from '../helpers/stats';
import { logger } from '../logger';
import type {
  DevConfig,
  InternalContext,
  RsbuildStatsItem,
  Rspack,
} from '../types';
import { formatBrowserErrorLog } from './browserLogs';
import { genOverlayHTML } from './overlay';

interface ExtWebSocket extends Ws {
  isAlive: boolean;
}

function isEqualSet(a: Set<string>, b: Set<string>): boolean {
  return a.size === b.size && [...a].every((value) => b.has(value));
}

const CHECK_SOCKETS_INTERVAL = 30000;

export type ServerMessageStaticChanged = {
  type: 'static-changed' | 'content-changed';
};

export type ServerMessageHash = {
  type: 'hash';
  data: string;
};

export type ServerMessageOk = {
  type: 'ok';
};

export type ServerMessageWarnings = {
  type: 'warnings';
  data: { text: string[] };
};

export type ServerMessageErrors = {
  type: 'errors';
  data: { text: string[]; html: string };
};

export type ServerMessage =
  | ServerMessageOk
  | ServerMessageStaticChanged
  | ServerMessageHash
  | ServerMessageWarnings
  | ServerMessageErrors;

export type ClientMessageError = {
  type: 'client-error';
  message: string;
  stack?: string;
};

export type ClientMessagePing = {
  type: 'ping';
};

export type ClientMessage = ClientMessagePing | ClientMessageError;

const parseQueryString = (req: IncomingMessage) => {
  const queryStr = req.url ? req.url.split('?')[1] : '';
  return queryStr ? Object.fromEntries(new URLSearchParams(queryStr)) : {};
};

export class SocketServer {
  private wsServer!: Ws.Server;

  private readonly socketsMap: Map<string, Set<Ws>> = new Map();

  private readonly options: DevConfig;

  private readonly context: InternalContext;

  private initialChunksMap: Map<string, Set<string>> = new Map();

  private heartbeatTimer: NodeJS.Timeout | null = null;

  private getOutputFileSystem: () => Rspack.OutputFileSystem;

  private reportedBrowserLogs: Set<string> = new Set();

  private currentHash: Map<string, string> = new Map();

  constructor(
    context: InternalContext,
    options: DevConfig,
    getOutputFileSystem: () => Rspack.OutputFileSystem,
  ) {
    this.context = context;
    this.options = options;
    this.getOutputFileSystem = getOutputFileSystem;
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
    const tokens = Object.values(this.context.environments).map(
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

      this.onConnect(socket as ExtWebSocket, query.token);
    });
  }

  public onBuildDone(token: string): void {
    this.reportedBrowserLogs.clear();

    if (!this.socketsMap.size) {
      return;
    }

    this.sendStats({ token });
  }

  /**
   * Write message to each socket
   * @param message - The message to send
   * @param token - The token of the socket to send the message to,
   * if not provided, the message will be sent to all sockets
   */
  public sockWrite(message: ServerMessage, token?: string): void {
    const messageStr = JSON.stringify(message);

    const sendToSockets = (sockets: Set<Ws>) => {
      for (const socket of sockets) {
        this.send(socket, messageStr);
      }
    };

    if (token) {
      const sockets = this.socketsMap.get(token);
      if (sockets) {
        sendToSockets(sockets);
      }
    } else {
      for (const sockets of this.socketsMap.values()) {
        sendToSockets(sockets);
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
    for (const sockets of this.socketsMap.values()) {
      sockets.forEach((socket) => {
        socket.close();
      });
    }

    // Reset all properties
    this.socketsMap.clear();
    this.initialChunksMap.clear();
    this.reportedBrowserLogs.clear();

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

  private onConnect(socket: ExtWebSocket, token: string) {
    socket.isAlive = true;

    // heartbeat
    socket.on('pong', () => {
      socket.isAlive = true;
    });

    socket.on('message', async (data) => {
      try {
        const message: ClientMessage = JSON.parse(
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          typeof data === 'string' ? data : data.toString(),
        );

        if (
          message.type === 'client-error' &&
          // Do not report browser error when using webpack
          this.context.bundlerType === 'rspack' &&
          // Do not report browser error when build failed
          !this.context.buildState.hasErrors
        ) {
          const log = await formatBrowserErrorLog(
            message,
            this.context,
            this.getOutputFileSystem(),
          );

          if (!this.reportedBrowserLogs.has(log)) {
            this.reportedBrowserLogs.add(log);
            logger.error(log);
          }
        }
      } catch {}
    });

    let sockets = this.socketsMap.get(token);
    if (!sockets) {
      sockets = new Set();
      this.socketsMap.set(token, sockets);
    }
    sockets.add(socket);

    socket.on('close', () => {
      const sockets = this.socketsMap.get(token);
      if (!sockets) {
        return;
      }

      sockets.delete(socket);
      if (sockets.size === 0) {
        this.socketsMap.delete(token);
      }
    });

    // send first stats to active client sock if stats exist
    this.sendStats({
      force: true,
      token,
    });
  }

  // Only use stats when environment is matched
  private getStats(token: string) {
    const { stats } = this.context.buildState;
    const environment = Object.values(this.context.environments).find(
      ({ webSocketToken }) => webSocketToken === token,
    );

    if (!stats || !environment) {
      return;
    }

    let currentStats: RsbuildStatsItem = stats;

    if (stats.children) {
      const childStats = stats.children[environment.index];
      if (childStats) {
        currentStats = childStats;
      }
    }

    // Collect errors and warnings from all stats
    // while using the matched stats for other data
    return {
      stats: currentStats,
      errors: getStatsErrors(stats),
      warnings: getStatsWarnings(stats),
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
    if (!result) {
      return null;
    }

    const { stats, errors, warnings } = result;

    // web-infra-dev/rspack#6633
    // when initial-chunks change, reload the page
    // e.g: ['index.js'] -> ['index.js', 'lib-polyfill.js']
    const newInitialChunks: Set<string> = new Set();
    if (stats.entrypoints) {
      for (const entrypoint of Object.values(stats.entrypoints)) {
        const { chunks } = entrypoint;

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

    const initialChunks = this.initialChunksMap.get(token);
    const shouldReload =
      stats.entrypoints &&
      initialChunks &&
      !isEqualSet(initialChunks, newInitialChunks);

    this.initialChunksMap.set(token, newInitialChunks);

    if (shouldReload) {
      this.sockWrite({ type: 'static-changed' }, token);
      return;
    }

    if (stats.hash) {
      const prevHash = this.currentHash.get(token);
      this.currentHash.set(token, stats.hash);

      // If build hash is not changed and there is no error or warning,
      // skip the other messages
      if (
        !force &&
        errors.length === 0 &&
        warnings.length === 0 &&
        prevHash === stats.hash
      ) {
        this.sockWrite({ type: 'ok' }, token);
        return;
      }

      this.sockWrite(
        {
          type: 'hash',
          data: stats.hash,
        },
        token,
      );
    }

    if (errors.length > 0) {
      const errorMessages = errors.map((item) => formatStatsError(item));

      this.sockWrite(
        {
          type: 'errors',
          data: {
            text: errorMessages,
            html: genOverlayHTML(errorMessages, this.context.rootPath),
          },
        },
        token,
      );
      return;
    }

    if (warnings.length > 0) {
      const warningMessages = warnings.map((item) => formatStatsError(item));

      this.sockWrite(
        {
          type: 'warnings',
          data: { text: warningMessages },
        },
        token,
      );
      return;
    }

    this.sockWrite({ type: 'ok' }, token);
  }

  // send message to connecting socket
  private send(socket: Ws, message: string) {
    if (socket.readyState !== socket.OPEN) {
      return;
    }

    socket.send(message);
  }
}
