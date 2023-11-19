import type { ListenOptions } from 'net';
import { createServer, Server } from 'http';
import connect from '@rsbuild/shared/connect';
import { join } from 'path';
import sirv from '../../compiled/sirv';
import {
  Context,
  RsbuildConfig,
  getPort,
  DEFAULT_PORT,
  StartServerResult,
  getAddressUrls,
  DEFAULT_DEV_HOST,
  printServerURLs,
  formatRoutes,
  ROOT_DIST_DIR,
  PreviewServerOptions,
  isFunction,
} from '@rsbuild/shared';
import { faviconFallbackMiddleware } from './middlewares';

type RsbuildProdServerOptions = {
  pwd: string;
  output: {
    path: string;
    assetPrefix?: string;
  };
};
export class RsbuildProdServer {
  private app!: Server;
  private options: RsbuildProdServerOptions;
  public middlewares = connect();

  constructor(options: RsbuildProdServerOptions) {
    this.options = options;
  }

  // Complete the preparation of services
  public async onInit(app: Server) {
    this.app = app;

    await this.applyDefaultMiddlewares();
  }

  private async applyDefaultMiddlewares() {
    this.applyStaticAssetMiddleware();

    this.middlewares.use(faviconFallbackMiddleware);
  }

  private applyStaticAssetMiddleware() {
    const {
      output: { path, assetPrefix },
      pwd,
    } = this.options;

    const assetMiddleware = sirv(join(pwd, path), {
      etag: true,
      dev: true,
      ignores: false,
    });

    this.middlewares.use((req, res, next) => {
      const url = req.url;

      // handler assetPrefix
      if (assetPrefix && url?.startsWith(assetPrefix)) {
        req.url = url.slice(assetPrefix.length);
        assetMiddleware(req, res, (...args) => {
          req.url = url;
          next(...args);
        });
      } else {
        assetMiddleware(req, res, next);
      }
    });
  }

  public async createHTTPServer() {
    return createServer(this.middlewares);
  }

  public listen(
    options?: number | ListenOptions | undefined,
    listener?: () => void,
  ) {
    const callback = () => {
      listener?.();
    };

    if (typeof options === 'object') {
      this.app.listen(options, callback);
    } else {
      this.app.listen(options || 8080, callback);
    }
  }

  public close() {
    this.app.close();
  }
}

export async function startProdServer(
  context: Context,
  rsbuildConfig: RsbuildConfig,
  { printURLs = true }: PreviewServerOptions = {},
) {
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
  }

  const port = await getPort(rsbuildConfig.dev?.port || DEFAULT_PORT);
  const server = new RsbuildProdServer({
    pwd: context.rootPath,
    output: {
      path: rsbuildConfig.output?.distPath?.root || ROOT_DIST_DIR,
      assetPrefix: rsbuildConfig.output?.assetPrefix,
    },
  });

  const httpServer = await server.createHTTPServer();

  await server.onInit(httpServer);

  return new Promise<StartServerResult>((resolve) => {
    server.listen(
      {
        host: DEFAULT_DEV_HOST,
        port,
      },
      () => {
        const urls = getAddressUrls('http', port);

        if (printURLs) {
          const routes = formatRoutes(
            context.entry,
            rsbuildConfig.output?.distPath?.html,
          );

          printServerURLs(
            isFunction(printURLs) ? printURLs(urls) : urls,
            routes,
          );
        }

        resolve({
          port,
          urls: urls.map((item) => item.url),
          server: {
            close: async () => {
              server.close();
            },
          },
        });
      },
    );
  });
}
