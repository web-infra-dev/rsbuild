import type { Server } from 'node:http';
import type { Http2SecureServer } from 'node:http2';
import { getPathnameFromUrl } from '../helpers/path';
import { logger } from '../logger';
import type {
  Connect,
  InternalContext,
  NormalizedConfig,
  PreviewOptions,
  ServerConfig,
} from '../types';
import { isCliShortcutsEnabled, setupCliShortcuts } from './cliShortcuts';
import {
  registerCleanup,
  removeCleanup,
  setupGracefulShutdown,
} from './gracefulShutdown';
import { gzipMiddleware } from './gzipMiddleware';
import {
  getAddressUrls,
  getRoutes,
  getServerConfig,
  getServerTerminator,
  printServerURLs,
  type StartServerResult,
} from './helper';
import { historyApiFallbackMiddleware } from './historyApiFallback';
import { createHttpServer } from './httpServer';
import {
  faviconFallbackMiddleware,
  getBaseMiddleware,
  getRequestLoggerMiddleware,
  notFoundMiddleware,
  optionsFallbackMiddleware,
} from './middlewares';
import { open } from './open';
import { createProxyMiddleware } from './proxy';

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
    const { headers, proxy, historyApiFallback, compress, base, cors } =
      this.options.serverConfig;

    if (logger.level === 'verbose') {
      this.middlewares.use(await getRequestLoggerMiddleware());
    }

    if (cors) {
      const { default: corsMiddleware } = await import(
        '../../compiled/cors/index.js'
      );
      this.middlewares.use(
        corsMiddleware(typeof cors === 'boolean' ? {} : cors),
      );
    }

    // apply `server.headers` option
    // `server.headers` can override `server.cors`
    if (headers) {
      this.middlewares.use((_req, res, next) => {
        for (const [key, value] of Object.entries(headers)) {
          res.setHeader(key, value);
        }
        next();
      });
    }

    // Apply proxy middleware
    // each proxy configuration creates its own middleware instance
    if (proxy) {
      const { middlewares, upgrade } = await createProxyMiddleware(proxy);

      for (const middleware of middlewares) {
        this.middlewares.use(middleware);
      }

      this.app.on('upgrade', upgrade);
    }

    // compression is placed after proxy middleware to avoid breaking SSE (Server-Sent Events),
    // but before other middlewares to ensure responses are properly compressed
    if (compress) {
      const { constants } = await import('node:zlib');
      this.middlewares.use(
        gzipMiddleware({
          // simulates the common gzip compression rates
          level: constants.Z_DEFAULT_COMPRESSION,
          ...(typeof compress === 'object' ? compress : undefined),
        }),
      );
    }

    if (base && base !== '/') {
      this.middlewares.use(getBaseMiddleware({ base }));
    }

    await this.applyStaticAssetMiddleware();

    if (historyApiFallback) {
      this.middlewares.use(
        historyApiFallbackMiddleware(
          historyApiFallback === true ? {} : historyApiFallback,
        ),
      );

      // ensure fallback request can be handled by sirv
      await this.applyStaticAssetMiddleware();
    }

    this.middlewares.use(faviconFallbackMiddleware);
    this.middlewares.use(optionsFallbackMiddleware);
    this.middlewares.use(notFoundMiddleware);
  }

  private async applyStaticAssetMiddleware() {
    const {
      output: { path, assetPrefixes },
      serverConfig: { htmlFallback },
    } = this.options;

    const { default: sirv } = await import('../../compiled/sirv/index.js');

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
  { getPortSilently }: PreviewOptions = {},
): Promise<StartServerResult> {
  const { port, host, https, portTip } = await getServerConfig({
    config,
  });

  const { default: connect } = await import('../../compiled/connect/index.js');
  const middlewares = connect();

  const serverConfig = config.server;
  const server = new RsbuildProdServer(
    {
      pwd: context.rootPath,
      output: {
        path: context.distPath,
        assetPrefixes: Object.values(context.environments).map((e) =>
          getPathnameFromUrl(e.config.output.assetPrefix),
        ),
      },
      serverConfig,
    },
    middlewares,
  );

  await context.hooks.onBeforeStartProdServer.callBatch();

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
        await context.hooks.onAfterStartProdServer.callBatch({
          port,
          routes,
          environments: context.environments,
        });

        const protocol = https ? 'https' : 'http';
        const urls = await getAddressUrls({ protocol, port, host });
        const cliShortcutsEnabled = isCliShortcutsEnabled(config);

        const cleanupGracefulShutdown = setupGracefulShutdown();

        let closingPromise: Promise<void> | null = null;

        const closeServer = async () => {
          if (!closingPromise) {
            closingPromise = (async () => {
              // ensure closeServer is only called once
              removeCleanup(closeServer);
              cleanupGracefulShutdown();
              await Promise.all([server.close(), serverTerminator()]);
            })();
          }
          return closingPromise;
        };

        registerCleanup(closeServer);

        const printUrls = () =>
          printServerURLs({
            urls,
            port,
            routes,
            protocol,
            printUrls: serverConfig.printUrls,
            trailingLineBreak: !cliShortcutsEnabled,
          });

        const openPage = async () => {
          return open({
            https,
            port,
            routes,
            config,
            clearCache: true,
          });
        };

        printUrls();

        if (cliShortcutsEnabled) {
          const shortcutsOptions =
            typeof config.dev.cliShortcuts === 'boolean'
              ? {}
              : config.dev.cliShortcuts;

          await setupCliShortcuts({
            openPage,
            closeServer,
            printUrls,
            help: shortcutsOptions.help,
            customShortcuts: shortcutsOptions.custom,
          });
        }

        if (!getPortSilently && portTip) {
          logger.info(portTip);
        }

        resolve({
          port,
          urls: urls.map((item) => item.url),
          server: {
            close: closeServer,
          },
        });
      },
    );
  });
}
