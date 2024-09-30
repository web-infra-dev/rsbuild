import type { Server } from 'node:http';
import type { Http2SecureServer } from 'node:http2';
import type Connect from 'connect';
import { pathnameParse } from '../helpers/path';
import { logger } from '../logger';
import type {
  InternalContext,
  NormalizedConfig,
  PreviewServerOptions,
  RequestHandler,
  ServerConfig,
} from '../types';
import {
  type StartServerResult,
  getAddressUrls,
  getRoutes,
  getServerConfig,
  getServerTerminator,
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
    assetPrefixes: string[];
  };
  serverConfig: ServerConfig;
};

export class RsbuildProdServer {
  private app!: Server | Http2SecureServer;
  private options: RsbuildProdServerOptions;
  public middlewares: Connect.Server;

  constructor(options: RsbuildProdServerOptions, middlewares: Connect.Server) {
    this.options = options;
    this.middlewares = middlewares;
  }

  // Complete the preparation of services
  public async onInit(app: Server | Http2SecureServer): Promise<void> {
    this.app = app;

    await this.applyDefaultMiddlewares();
  }

  private async applyDefaultMiddlewares() {
    const { headers, proxy, historyApiFallback, compress } =
      this.options.serverConfig;

    if (logger.level === 'verbose') {
      this.middlewares.use(await getRequestLoggerMiddleware());
    }

    // compression should be the first middleware
    if (compress) {
      const { gzipMiddleware } = await import('./gzipMiddleware');
      this.middlewares.use(
        gzipMiddleware({
          // simulates the common gzip compression rates
          level: 6,
        }),
      );
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
      const { middlewares, upgrade } = await createProxyMiddleware(proxy);

      for (const middleware of middlewares) {
        this.middlewares.use(middleware);
      }

      this.app.on('upgrade', upgrade);
    }

    this.applyStaticAssetMiddleware();

    if (historyApiFallback) {
      const { default: connectHistoryApiFallback } = await import(
        'connect-history-api-fallback'
      );
      const historyApiFallbackMiddleware = connectHistoryApiFallback(
        historyApiFallback === true ? {} : historyApiFallback,
      ) as RequestHandler;

      this.middlewares.use(historyApiFallbackMiddleware);

      // ensure fallback request can be handled by sirv
      await this.applyStaticAssetMiddleware();
    }

    this.middlewares.use(faviconFallbackMiddleware);
  }

  private async applyStaticAssetMiddleware() {
    const {
      output: { path, assetPrefixes },
      serverConfig: { htmlFallback },
    } = this.options;

    const { default: sirv } = await import('sirv');

    const assetMiddleware = sirv(path, {
      etag: true,
      dev: true,
      ignores: ['favicon.ico'],
      single: htmlFallback === 'index',
    });

    this.middlewares.use((req, res, next) => {
      const url = req.url;
      const assetPrefix =
        url && assetPrefixes.find((prefix) => url.startsWith(prefix));

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

  public async close(): Promise<void> {}
}

export async function startProdServer(
  context: InternalContext,
  config: NormalizedConfig,
  { getPortSilently }: PreviewServerOptions = {},
): Promise<StartServerResult> {
  const { port, host, https, portTip } = await getServerConfig({
    config,
  });

  const { default: connect } = await import('connect');
  const middlewares = connect();

  const serverConfig = config.server;
  const server = new RsbuildProdServer(
    {
      pwd: context.rootPath,
      output: {
        path: context.distPath,
        assetPrefixes: Object.values(context.environments).map((e) =>
          pathnameParse(e.config.output.assetPrefix),
        ),
      },
      serverConfig,
    },
    middlewares,
  );

  await context.hooks.onBeforeStartProdServer.call();

  const httpServer = await createHttpServer({
    serverConfig,
    middlewares: server.middlewares,
  });
  const serverTerminator = getServerTerminator(httpServer);

  await server.onInit(httpServer);

  return new Promise<StartServerResult>((resolve) => {
    httpServer.listen(
      {
        host,
        port,
      },
      async () => {
        const routes = getRoutes(context);
        await context.hooks.onAfterStartProdServer.call({
          port,
          routes,
          environments: context.environments,
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

        if (portTip && !getPortSilently) {
          logger.info(portTip);
        }

        const onClose = async () => {
          await Promise.all([server.close(), serverTerminator()]);
        };

        resolve({
          port,
          urls: urls.map((item) => item.url),
          server: {
            close: onClose,
          },
        });
      },
    );
  });
}
