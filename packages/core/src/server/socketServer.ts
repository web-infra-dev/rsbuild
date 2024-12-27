import type { IncomingMessage } from 'node:http';
import type { Socket } from 'node:net';
import { parse } from 'node:querystring';
import type Ws from 'ws';
import {
  getAllStatsErrors,
  getAllStatsWarnings,
  getStatsOptions,
} from '../helpers';
import { formatStatsMessages } from '../helpers/format';
import { logger } from '../logger';
import type { DevConfig, Rspack } from '../types';
import { getCompilationId } from './helper';
import { genOverlayHTML } from './overlay';

interface ExtWebSocket extends Ws {
  isAlive: boolean;
}

function isEqualSet(a: Set<string>, b: Set<string>): boolean {
  return a.size === b.size && [...a].every((value) => b.has(value));
}

interface SocketMessage {
  type: string;
  compilationId?: string;
  data?: Record<string, any> | string | boolean;
}

export class SocketServer {
  private wsServer!: Ws.Server;

  private readonly sockets: Ws[] = [];

  private readonly options: DevConfig;

  private stats: Record<string, Rspack.Stats>;
  private initialChunks: Record<string, Set<string>>;

  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(options: DevConfig) {
    this.options = options;
    this.stats = {};
    this.initialChunks = {};
  }

  public upgrade(req: IncomingMessage, sock: Socket, head: any): void {
    // subscribe upgrade event to handle socket

    if (!this.wsServer.shouldHandle(req)) {
      return;
    }

    this.wsServer.handleUpgrade(req, sock, head, (connection) => {
      this.wsServer.emit('connection', connection, req);
    });
  }

  // create socket, install socket handler, bind socket event
  public async prepare(): Promise<void> {
    const { default: ws } = await import('../../compiled/ws/index.js');
    // @ts-expect-error HTTP not match
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

    this.wsServer.on('connection', (socket, req) => {
      // /rsbuild-hmr?compilationId=web
      const queryStr = req.url ? req.url.split('?')[1] : '';

      this.onConnect(
        socket,
        queryStr ? (parse(queryStr) as Record<string, string>) : {},
      );
    });
  }

  public updateStats(stats: Rspack.Stats): void {
    const compilationId = getCompilationId(stats.compilation);

    this.stats[compilationId] = stats;

    this.sendStats({
      compilationId,
    });
  }

  // write message to each socket
  public sockWrite({ type, compilationId, data }: SocketMessage): void {
    for (const socket of this.sockets) {
      this.send(socket, JSON.stringify({ type, data, compilationId }));
    }
  }

  private singleWrite(
    socket: Ws,
    { type, data, compilationId }: SocketMessage,
  ) {
    this.send(socket, JSON.stringify({ type, data, compilationId }));
  }

  public close(): void {
    for (const socket of this.sockets) {
      socket.close();
    }

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private onConnect(socket: Ws, params: Record<string, string>) {
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
      this.singleWrite(connection, {
        type: 'hot',
        compilationId: params.compilationId,
      });
    }

    // send first stats to active client sock if stats exist
    if (this.stats) {
      this.sendStats({
        force: true,
        compilationId: params.compilationId,
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
    return curStats.toJson({ ...defaultStats, ...statsOptions });
  }

  // determine what message should send by stats
  private sendStats({
    force = false,
    compilationId,
  }: {
    compilationId: string;
    force?: boolean;
  }) {
    const stats = this.getStats(compilationId);

    // this should never happened
    if (!stats) {
      return null;
    }

    // web-infra-dev/rspack#6633
    // when initial-chunks change, reload the page
    // e.g: ['index.js'] -> ['index.js', 'lib-polyfill.js']
    const newInitialChunks: Set<string> = new Set();
    if (stats.entrypoints) {
      for (const entrypoint of Object.values(stats.entrypoints)) {
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

    const initialChunks = this.initialChunks[compilationId];
    const shouldReload =
      Boolean(stats.entrypoints) &&
      Boolean(initialChunks) &&
      !isEqualSet(initialChunks, newInitialChunks);

    this.initialChunks[compilationId] = newInitialChunks;

    if (shouldReload) {
      return this.sockWrite({
        type: 'static-changed',
        compilationId,
      });
    }

    const shouldEmit =
      !force &&
      stats &&
      !stats.errorsCount &&
      stats.assets &&
      stats.assets.every((asset: any) => !asset.emitted);

    if (shouldEmit) {
      return this.sockWrite({
        type: 'still-ok',
        compilationId,
      });
    }

    this.sockWrite({
      type: 'hash',
      compilationId,
      data: stats.hash,
    });

    if (stats.errorsCount) {
      const errors = getAllStatsErrors(stats);
      const { errors: formattedErrors } = formatStatsMessages({
        errors,
        warnings: [],
      });

      return this.sockWrite({
        type: 'errors',
        compilationId,
        data: {
          text: formattedErrors,
          html: genOverlayHTML(formattedErrors),
        },
      });
    }

    if (stats.warningsCount) {
      const warnings = getAllStatsWarnings(stats);
      const { warnings: formattedWarnings } = formatStatsMessages({
        warnings,
        errors: [],
      });
      return this.sockWrite({
        type: 'warnings',
        compilationId,
        data: {
          text: formattedWarnings,
        },
      });
    }

    return this.sockWrite({
      type: 'ok',
      compilationId,
    });
  }

  // send message to connecting socket
  private send(connection: Ws, message: string) {
    if (connection.readyState !== 1) {
      return;
    }

    connection.send(message);
  }
}
