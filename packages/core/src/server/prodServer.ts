import { Server } from 'http';
import connect from '@rsbuild/shared/connect';
import { join } from 'path';
import sirv from '../../compiled/sirv';
import {
  getAddressUrls,
  printServerURLs,
  formatRoutes,
  ROOT_DIST_DIR,
  isFunction,
  getServerOptions,
  type ServerConfig,
  type RsbuildConfig,
  type RequestHandler,
  type StartServerResult,
  type PreviewServerOptions,
} from '@rsbuild/shared';
import { faviconFallbackMiddleware } from './middlewares';
import type { Context } from '../types';
import { createHttpServer } from './httpServer';

type RsbuildProdServerOptions = {
  pwd: string;
  output: {
    path: string;
    assetPrefix?: string;
  };
  serverConfig: ServerConfig;
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
    const { headers, proxy, historyApiFallback, compress } =
      this.options.serverConfig;

    // compression should be the first middleware
    if (compress) {
      const { default: compression } = await import(
        '../../compiled/http-compression'
      );
      this.middlewares.use((req, res, next) => {
        compression({
          gzip: true,
          brotli: false,
        })(req, res, next);
      });
    }

    if (headers) {
      this.middlewares.use((_req, res, next) => {
        for (const [key, value] of Object.entries(headers)) {
          res.setHeader(key, value);
        }
        next();
      });
    }

    if (proxy) {
      const { createProxyMiddleware } = await import('./proxy');
      const { middlewares, upgrade } = createProxyMiddleware(proxy);
      middlewares.forEach((middleware) => {
        this.middlewares.use(middleware);
      });

      this.app.on('upgrade', upgrade);
    }

    this.applyStaticAssetMiddleware();

    if (historyApiFallback) {
      const { default: connectHistoryApiFallback } = await import(
        '../../compiled/connect-history-api-fallback'
      );
      const historyApiFallbackMiddleware = connectHistoryApiFallback(
        historyApiFallback === true ? {} : historyApiFallback,
      ) as RequestHandler;

      this.middlewares.use(historyApiFallbackMiddleware);

      // ensure fallback request can be handled by sirv
      this.applyStaticAssetMiddleware();
    }

    this.middlewares.use(faviconFallbackMiddleware);
  }

  private applyStaticAssetMiddleware() {
    const {
      output: { path, assetPrefix },
      serverConfig: { htmlFallback },
      pwd,
    } = this.options;

    const assetMiddleware = sirv(join(pwd, path), {
      etag: true,
      dev: true,
      ignores: ['favicon.ico'],
      single: htmlFallback === 'index',
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

  public close() {}
}

export async function startProdServer(
  context: Context,
  rsbuildConfig: RsbuildConfig,
  { printURLs = true, getPortSilently }: PreviewServerOptions = {},
) {
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
  }

  const { serverConfig, port, host, https } = await getServerOptions({
    rsbuildConfig,
    getPortSilently,
  });

  const server = new RsbuildProdServer({
    pwd: context.rootPath,
    output: {
      path: rsbuildConfig.output?.distPath?.root || ROOT_DIST_DIR,
      assetPrefix: rsbuildConfig.output?.assetPrefix,
    },
    serverConfig,
  });

  await context.hooks.onBeforeStartProdServerHook.call();

  const httpServer = await createHttpServer({
    https: serverConfig.https,
    middlewares: server.middlewares,
  });

  await server.onInit(httpServer);

  return new Promise<StartServerResult>((resolve) => {
    httpServer.listen(
      {
        host,
        port,
      },
      async () => {
        const routes = formatRoutes(
          context.entry,
          rsbuildConfig.output?.distPath?.html,
          rsbuildConfig.html?.outputStructure,
        );
        await context.hooks.onAfterStartProdServerHook.call({
          port,
          routes,
        });

        const urls = getAddressUrls(https ? 'https' : 'http', port);

        if (printURLs) {
          printServerURLs(
            isFunction(printURLs) ? printURLs(urls) : urls,
            routes,
          );
        }

        const onClose = () => {
          server.close();
          httpServer.close();
        };

        resolve({
          port,
          urls: urls.map((item) => item.url),
          server: {
            close: async () => {
              onClose();
            },
          },
        });
      },
    );
  });
}
