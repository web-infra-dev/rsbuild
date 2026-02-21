import { getPathnameFromUrl } from '../helpers/path';
import { isVerbose, logger } from '../logger';
import type {
  InternalContext,
  NormalizedConfig,
  PreviewOptions,
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
  getServerTerminator,
  printServerURLs,
  type RsbuildServerBase,
  resolvePort,
  type StartProdServerResult,
} from './helper';
import { historyApiFallbackMiddleware } from './historyApiFallback';
import { createHttpServer } from './httpServer';
import {
  faviconFallbackMiddleware,
  getBaseUrlMiddleware,
  getRequestLoggerMiddleware,
  notFoundMiddleware,
  optionsFallbackMiddleware,
} from './middlewares';
import { open } from './open';
import { createProxyMiddleware } from './proxy';
import { applyServerSetup } from './serverSetup';

export type RsbuildProdServer = RsbuildServerBase;

export async function startProdServer(
  context: InternalContext,
  config: NormalizedConfig,
  { getPortSilently }: PreviewOptions = {},
): Promise<StartProdServerResult> {
  const { default: connect } = await import(
    /* webpackChunkName: "connect" */ 'connect'
  );
  const middlewares = connect();

  const { port, portTip } = await resolvePort(config);

  const serverConfig = config.server;
  const { host, headers, proxy, historyApiFallback, compress, base, cors } =
    serverConfig;

  const httpServer = await createHttpServer({
    serverConfig,
    middlewares,
  });

  const cleanupGracefulShutdown = setupGracefulShutdown();
  const serverTerminator = getServerTerminator(httpServer);

  let closingPromise: Promise<void> | null = null;

  const closeServer = async () => {
    if (!closingPromise) {
      closingPromise = (async () => {
        // ensure closeServer is only called once
        removeCleanup(closeServer);
        cleanupGracefulShutdown();
        await serverTerminator();
      })();
    }
    return closingPromise;
  };

  const prodServer: RsbuildProdServer = {
    httpServer,
    port,
    middlewares,
    close: closeServer,
  };

  const isHttps = Boolean(serverConfig.https);

  const postSetupCallbacks = await applyServerSetup(serverConfig.setup, {
    action: 'preview',
    server: prodServer,
    environments: context.environments,
  });

  await context.hooks.onBeforeStartProdServer.callBatch({
    server: prodServer,
    environments: context.environments,
  });

  const applyStaticAssetMiddleware = async () => {
    const { default: sirv } = await import(
      /* webpackChunkName: "sirv" */ 'sirv'
    );

    const assetsMiddleware = sirv(context.distPath, {
      etag: true,
      dev: true,
      ignores: ['favicon.ico'],
      single: serverConfig.htmlFallback === 'index',
    });

    const assetPrefixes = context.environmentList.map((e) =>
      getPathnameFromUrl(e.config.output.assetPrefix),
    );

    middlewares.use(function staticAssetMiddleware(req, res, next) {
      const { url } = req;
      const assetPrefix =
        url && assetPrefixes.find((prefix) => url.startsWith(prefix));

      // handling assetPrefix
      if (assetPrefix && url?.startsWith(assetPrefix)) {
        req.url = url.slice(assetPrefix.length);
        assetsMiddleware(req, res, (...args: unknown[]) => {
          req.url = url;
          next(...args);
        });
      } else {
        assetsMiddleware(req, res, next);
      }
    });
  };

  if (isVerbose()) {
    middlewares.use(getRequestLoggerMiddleware());
  }

  if (cors) {
    const { default: corsMiddleware } = await import(
      /* webpackChunkName: "cors" */ 'cors'
    );
    middlewares.use(corsMiddleware(typeof cors === 'boolean' ? {} : cors));
  }

  // apply `server.headers` option
  // `server.headers` can override `server.cors`
  if (headers) {
    middlewares.use((_req, res, next) => {
      for (const [key, value] of Object.entries(headers)) {
        res.setHeader(key, value);
      }
      next();
    });
  }

  // Apply proxy middleware
  // each proxy configuration creates its own middleware instance
  if (proxy) {
    const { middlewares: proxyMiddlewares, upgrade } =
      await createProxyMiddleware(proxy);

    for (const middleware of proxyMiddlewares) {
      middlewares.use(middleware);
    }

    httpServer.on('upgrade', upgrade);
  }

  // compression is placed after proxy middleware to avoid breaking SSE (Server-Sent Events),
  // but before other middlewares to ensure responses are properly compressed
  if (compress) {
    const { constants } = await import('node:zlib');
    middlewares.use(
      gzipMiddleware({
        // simulates the common gzip compression rates
        level: constants.Z_DEFAULT_COMPRESSION,
        ...(typeof compress === 'object' ? compress : undefined),
      }),
    );
  }

  if (base && base !== '/') {
    middlewares.use(getBaseUrlMiddleware({ base }));
  }

  await applyStaticAssetMiddleware();

  if (historyApiFallback) {
    middlewares.use(
      historyApiFallbackMiddleware(
        historyApiFallback === true ? {} : historyApiFallback,
      ),
    );

    // ensure fallback request can be handled by sirv
    await applyStaticAssetMiddleware();
  }

  for (const callback of postSetupCallbacks) {
    await callback();
  }

  middlewares.use(faviconFallbackMiddleware);
  middlewares.use(optionsFallbackMiddleware);
  middlewares.use(notFoundMiddleware);

  return new Promise<StartProdServerResult>((resolve) => {
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

        const protocol = isHttps ? 'https' : 'http';
        const urls = await getAddressUrls({ protocol, port, host });
        const cliShortcutsEnabled = isCliShortcutsEnabled(config);

        registerCleanup(closeServer);

        const printUrls = () =>
          printServerURLs({
            urls,
            port,
            routes,
            protocol,
            printUrls: serverConfig.printUrls,
            trailingLineBreak: !cliShortcutsEnabled,
            originalConfig: context.originalConfig,
          });

        const openPage = async () => {
          return open({
            port,
            routes,
            config,
            protocol,
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
          server: prodServer,
        });
      },
    );
  });
}
