import { Common, SDK, Thirdparty, Client } from '@rsbuild/doctor-types';
import { Server } from '@rsbuild/doctor-utils/build';
import { Bundle } from '@rsbuild/doctor-utils/common';
import assert from 'assert';
import bodyParser from 'body-parser';
import open from 'open';
import ip from 'ip';
import cors from 'cors';
import { PassThrough } from 'stream';
import { Socket } from './socket';
import { Router } from './router';
import * as APIs from './apis';
export * from './utils';

export class DoctorServer implements SDK.DoctorServerInstance {
  private _server!: Common.PromiseReturnType<typeof Server.createServer>;

  public port: number;

  private _socket?: Socket;

  private disposed = true;

  private _router: Router;

  constructor(
    protected sdk: SDK.DoctorBuilderSDKInstance,
    port = Server.defaultPort,
  ) {
    assert(typeof port === 'number');
    // maybe the port will be rewrite in bootstrap()
    this.port = port;
    this._router = new Router({ sdk, server: this, apis: Object.values(APIs) });
  }

  public get app(): SDK.DoctorServerInstance['app'] {
    return this._server.app;
  }

  public get origin(): string {
    const host = ip.address();
    return `http://${host}:${this.port}`;
  }

  public get socketUrl(): string {
    return `ws://${ip.address()}:${this.port}`;
  }

  async bootstrap() {
    if (!this.disposed) {
      return;
    }

    const port = Server.getPortSync(this.port);
    // rewrite port when the default port is unavailable
    this.port = port;
    this._server = await Server.createServer(port);
    this._socket = new Socket({
      sdk: this.sdk,
      server: this._server.server,
      port: this.port,
    });
    await this._socket.bootstrap();

    this.disposed = false;

    this.app.use(cors());
    this.app.use(bodyParser.json({ limit: '500mb' }));

    await this._router.setup();

    process.once('exit', this.dispose);
    process.once('SIGINT', this.dispose);
    process.once('SIGTERM', this.dispose);
    process.once('unhandledRejection', this.dispose);
    process.once('uncaughtException', this.dispose);
  }

  protected wrapNextHandleFunction(
    method: 'GET' | 'POST',
    cb: (
      ...args: Parameters<Thirdparty.connect.NextHandleFunction>
    ) => Common.PlainObject | string,
  ): Thirdparty.connect.NextHandleFunction {
    return async (req, res, next) => {
      const m = req.method?.toUpperCase();
      if (m === method) {
        try {
          const body = await cb(req, res, next);

          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Credentials', 'true');
          res.statusCode = 200;

          if (Buffer.isBuffer(body)) {
            res.setHeader('Content-Length', body.byteLength);
            const ps = new PassThrough();
            ps.write(body);
            ps.end();
            ps.pipe(res);
          } else if (body && typeof body === 'object') {
            res.writeHead(200, {
              'Content-Type': 'application/json;utf-8',
            });
            res.write(JSON.stringify(body));
            res.end();
          } else {
            res.writeHead(200).end(body);
          }
        } catch (error) {
          res.statusCode = 500;
          res.end((error as Error).message);
          return next(error);
        }
        return;
      }
      await next();
    };
  }

  public proxy(
    api: SDK.ServerAPI.API,
    method: 'GET' | 'POST',
    cb: (
      ...args: Parameters<Thirdparty.connect.NextHandleFunction>
    ) => Common.PlainObject | string,
  ) {
    let idx = this.app.stack.findIndex((e) => e.route === api);
    if (idx === -1) {
      idx = this.app.stack.length - 1;
    }
    this.app.stack.splice(idx, 0, {
      route: api,
      handle: this.wrapNextHandleFunction(method, cb),
    });
  }

  public get: SDK.DoctorServerInstance['get'] = (route, cb) => {
    const { app } = this;
    app.use(route, this.wrapNextHandleFunction('GET', cb));
    return app;
  };

  public post: SDK.DoctorServerInstance['post'] = (route, cb) => {
    const { app } = this;
    app.use(route, this.wrapNextHandleFunction('POST', cb));
    return app;
  };

  public getClientUrl(
    route: Client.DoctorClientRoutes,
    baselineUrl: string,
    currentUrl: string,
  ): string;

  public getClientUrl(route?: 'homepage'): string;

  public getClientUrl(route = 'homepage', ...args: unknown[]) {
    const url = `${this.origin}${SDK.ServerAPI.API.EntryHtml}`;

    switch (route) {
      case Client.DoctorClientRoutes.BundleDiff: {
        const [baseline, current] = args as string[];
        const qs = Bundle.getBundleDiffPageQueryString([baseline, current]);
        return `${url}${qs}#${Client.DoctorClientRoutes.BundleDiff}`;
      }
      default:
        return url;
    }
  }

  public async openClientPage(
    route: Client.DoctorClientRoutes,
    baselineUrl: string,
    currentUrl: string,
  ): Promise<void>;

  public async openClientPage(route?: 'homepage'): Promise<void>;

  public async openClientPage(...args: unknown[]) {
    const url = this.getClientUrl(
      ...(args as Parameters<SDK.DoctorServerInstance['getClientUrl']>),
    );
    await open(url);
    console.log(`Web Doctor analyze run at: ${url}`);
  }

  public sendAPIDataToClient<
    T extends SDK.ServerAPI.API | SDK.ServerAPI.APIExtends,
  >(api: T, msg: SDK.ServerAPI.SocketResponseType<T>) {
    this._socket?.sendAPIData(api, msg);
  }

  public async broadcast() {
    await this._socket?.broadcast();
  }

  dispose = async () => {
    if (this.disposed) return;
    this.disposed = true;

    if (this._server) {
      await this._server.close();
    }

    // must close socket after server to avoid socket.io close error.
    if (this._socket) {
      this._socket.dispose();
    }
  };
}
