import type { Server } from 'node:http';
import type { Http2SecureServer } from 'node:http2';
import { join } from 'node:path';
import {
  type PreviewServerOptions,
  ROOT_DIST_DIR,
  type RequestHandler,
  type ServerConfig,
  type StartServerResult,
  getNodeEnv,
  isDebug,
  setNodeEnv,
} from '@rsbuild/shared';
import connect from '@rsbuild/shared/connect';
import sirv from '../../compiled/sirv/index.js';
import type { InternalContext, NormalizedConfig } from '../types';
import {
  formatRoutes,
  getAddressUrls,
  getServerConfig,
  printServerURLs,
} from './helper';
import { createHttpServer } from './httpServer';
import {
  faviconFallbackMiddleware,
  getRequestLoggerMiddleware,
} from './middlewares';

type RsbuildProdServerOptions = {
  pwd: string;
  output: {
    path: string;
    assetPrefix?: string;
  };
  serverConfig: ServerConfig;
};

export class RsbuildProdServer {
  private app!: Server | Http2SecureServer;
  private options: RsbuildProdServerOptions;
  public middlewares = connect();

  constructor(options: RsbuildProdServerOptions) {
    this.options = options;
  }

  // Complete the preparation of services
  public async onInit(app: Server | Http2SecureServer) {
    this.app = app;

    await this.applyDefaultMiddlewares();
  }

  private async applyDefaultMiddlewares() {
    const { headers, proxy, historyApiFallback, compress } =
      this.options.serverConfig;

    if (isDebug()) {
      this.middlewares.use(await getRequestLoggerMiddleware());
    }

    // compression should be the first middleware
    if (compress) {
      const { default: compression } = await import(
        '../../compiled/http-compression/index.js'
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

      for (const middleware of middlewares) {
        this.middlewares.use(middleware);
      }

      this.app.on('upgrade', upgrade);
    }

    this.applyStaticAssetMiddleware();

    if (historyApiFallback) {
      const { default: connectHistoryApiFallback } = await import(
        '../../compiled/connect-history-api-fallback/index.js'
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
        assetMiddleware(req, res, (...args: unknown[]) => {
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
  context: InternalContext,
  config: NormalizedConfig,
  { getPortSilently }: PreviewServerOptions = {},
) {
  if (!getNodeEnv()) {
    setNodeEnv('production');
  }

  const { port, host, https } = await getServerConfig({
    config,
    getPortSilently,
  });

  const serverConfig = config.server;
  const server = new RsbuildProdServer({
    pwd: context.rootPath,
    output: {
      path: config.output.distPath.root || ROOT_DIST_DIR,
      assetPrefix: config.output.assetPrefix,
    },
    serverConfig,
  });

  await context.hooks.onBeforeStartProdServer.call();

  const httpServer = await createHttpServer({
    serverConfig,
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
          config.output.distPath.html,
          config.html.outputStructure,
        );
        await context.hooks.onAfterStartProdServer.call({
          port,
          routes,
        });

        const protocol = https ? 'https' : 'http';
        const urls = getAddressUrls({ protocol, port, host });

        printServerURLs({
          urls,
          port,
          routes,
          protocol,
          printUrls: serverConfig.printUrls,
        });

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
