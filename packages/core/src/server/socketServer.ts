import type { IncomingMessage } from 'node:http';
import type { Socket } from 'node:net';
import { type DevConfig, type Stats, logger } from '@rsbuild/shared';
import type Ws from '../../compiled/ws/index.js';
import { getAllStatsErrors, getAllStatsWarnings } from '../helpers';

interface ExtWebSocket extends Ws {
  isAlive: boolean;
}

export class SocketServer {
  private wsServer!: Ws.Server;

  private readonly sockets: Ws[] = [];

  private readonly options: DevConfig;

  private stats?: Stats;

  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(options: DevConfig) {
    this.options = options;
  }

  public upgrade(req: IncomingMessage, sock: Socket, head: any) {
    // subscribe upgrade event to handle socket

    if (!this.wsServer.shouldHandle(req)) {
      return;
    }

    this.wsServer.handleUpgrade(req, sock, head, (connection) => {
      this.wsServer.emit('connection', connection, req);
    });
  }

  // create socket, install socket handler, bind socket event
  public async prepare() {
    const { default: ws } = await import('../../compiled/ws/index.js');
    this.wsServer = new ws.Server({
      noServer: true,
      path: this.options.client?.path,
    });

    this.wsServer.on('error', (err: Error) => {
      // only dev server, use default logger
      logger.error(err);
    });

    this.timer = setInterval(() => {
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
    }, 30000);

    this.wsServer.on('connection', (socket) => {
      this.onConnect(socket);
    });
  }

  public updateStats(stats: Stats) {
    this.stats = stats;
    this.sendStats();
  }

  // write message to each socket
  public sockWrite(
    type: string,
    data?: Record<string, any> | string | boolean,
  ) {
    for (const socket of this.sockets) {
      this.send(socket, JSON.stringify({ type, data }));
    }
  }

  public singleWrite(
    socket: Ws,
    type: string,
    data?: Record<string, any> | string | boolean,
  ) {
    this.send(socket, JSON.stringify({ type, data }));
  }

  public close() {
    for (const socket of this.sockets) {
      socket.close();
    }

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private onConnect(socket: Ws) {
    const connection = socket as ExtWebSocket;

    connection.isAlive = true;
    connection.on('pong', () => {
      connection.isAlive = true;
    });

    if (!connection) {
      return;
    }

    this.sockets.push(connection);

    connection.on('close', () => {
      const idx = this.sockets.indexOf(connection);

      if (idx >= 0) {
        this.sockets.splice(idx, 1);
      }
    });

    if (this.options.hmr || this.options.liveReload) {
      this.singleWrite(connection, 'hot');
    }

    // send first stats to active client sock if stats exist
    if (this.stats) {
      this.sendStats(true);
    }
  }

  // get standard stats
  private getStats() {
    const curStats = this.stats;

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
      children: true,
    };

    return curStats.toJson(defaultStats);
  }

  // determine what message should send by stats
  private sendStats(force = false) {
    const stats = this.getStats();

    // this should never happened
    if (!stats) {
      return null;
    }

    const shouldEmit =
      !force &&
      stats &&
      !stats.errorsCount &&
      stats.assets &&
      stats.assets.every((asset: any) => !asset.emitted);

    if (shouldEmit) {
      return this.sockWrite('still-ok');
    }

    this.sockWrite('hash', stats.hash);

    if (stats.errorsCount) {
      return this.sockWrite('errors', getAllStatsErrors(stats));
    }
    if (stats.warningsCount) {
      return this.sockWrite('warnings', getAllStatsWarnings(stats));
    }
    return this.sockWrite('ok');
  }

  // send message to connecting socket
  private send(connection: Ws, message: string) {
    if (connection.readyState !== 1) {
      return;
    }

    connection.send(message);
  }
}
