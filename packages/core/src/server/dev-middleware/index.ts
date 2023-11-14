import { Server } from 'http';
import { EventEmitter } from 'events';
import type {
  DevConfig,
  DevMiddlewareAPI,
  DevMiddleware as CustomDevMiddleware,
} from '@rsbuild/shared';
import SocketServer from './socketServer';

type Options = {
  dev: DevConfig;
  devMiddleware?: CustomDevMiddleware;
};

const noop = () => {
  // noop
};

function getHMRClientPath(client: DevConfig['client']) {
  const protocol = client?.protocol ? `&protocol=${client.protocol}` : '';
  const host = client?.host ? `&host=${client.host}` : '';
  const path = client?.path ? `&path=${client.path}` : '';
  const port = client?.port ? `&port=${client.port}` : '';

  const clientEntry = `${require.resolve(
    '@rsbuild/core/client/hmr',
  )}?${host}${path}${port}${protocol}`;

  // replace cjs with esm because we want to use the es5 version
  return clientEntry;
}

export default class DevMiddleware extends EventEmitter {
  public middleware?: DevMiddlewareAPI;

  private devOptions: DevConfig;

  private devMiddleware?: CustomDevMiddleware;

  private socketServer: SocketServer;

  constructor({ dev, devMiddleware }: Options) {
    super();

    this.devOptions = dev;

    // init socket server
    this.socketServer = new SocketServer(dev);

    this.devMiddleware = devMiddleware;
  }

  public init(app: Server) {
    if (this.devMiddleware) {
      // start compiling
      this.middleware = this.setupDevMiddleware(this.devMiddleware);
    }

    app.on('listening', () => {
      this.socketServer.prepare(app);
    });

    app.on('close', async () => {
      this.middleware?.close(noop);
      this.socketServer.close();
    });
  }

  public sockWrite(
    type: string,
    data?: Record<string, any> | string | boolean,
  ) {
    this.socketServer.sockWrite(type, data);
  }

  private setupDevMiddleware(devMiddleware: CustomDevMiddleware) {
    const { devOptions } = this;

    const callbacks = {
      onInvalid: () => {
        this.socketServer.sockWrite('invalid');
      },
      onDone: (stats: any) => {
        this.socketServer.updateStats(stats);
        this.emit('change', stats);
      },
    };

    const enableHMR = this.devOptions.hmr;

    const middleware = devMiddleware({
      headers: devOptions.headers,
      stats: false,
      callbacks,
      hmrClientPath: enableHMR
        ? getHMRClientPath(devOptions.client)
        : undefined,
      serverSideRender: true,
      ...devOptions.devMiddleware,
    });

    return middleware;
  }
}
