import { format } from 'node:util';
import type { RequestHandler } from 'http-proxy-middleware';
import { color, normalizeProxyConfig } from '../helpers';
import type { Logger } from '../logger';
import type {
  RequestHandler as Middleware,
  ProxyConfig,
  ProxyOptions,
} from '../types';
import { HttpCode, type UpgradeEvent } from './helper';

export async function createProxyMiddleware(
  proxyOptions: ProxyConfig,
  logger: Logger,
): Promise<{
  middlewares: Middleware[];
  upgrade: UpgradeEvent;
}> {
  const logPrefix = color.dim('[http-proxy-middleware]: ');
  const defaultOptions: ProxyOptions = {
    changeOrigin: true,
    logger: {
      info(msg: string, ...args: unknown[]) {
        logger.debug(logPrefix + format(msg, ...args));
      },
      warn: (msg: string, ...args: unknown[]) => {
        logger.warn(logPrefix + format(msg, ...args));
      },
      error: (msg: string, ...args: unknown[]) => {
        logger.error(logPrefix + format(msg, ...args));
      },
    },
  };

  const proxyMiddlewares: RequestHandler[] = [];
  const middlewares: Middleware[] = [];

  const { createProxyMiddleware: baseMiddleware } = await import(
    /* rspackChunkName: "http-proxy-middleware" */ 'http-proxy-middleware'
  );

  for (const rule of normalizeProxyConfig(proxyOptions)) {
    const opts = { ...defaultOptions, ...rule };
    const proxyMiddleware = baseMiddleware({
      ...opts,
      // Rsbuild dispatches upgrades explicitly and removes its listener on close.
      // Prevent HTTP requests from registering an additional proxy listener.
      ws: false,
    });

    const middleware: Middleware = async (req, res, next) => {
      const bypassUrl =
        typeof opts.bypass === 'function'
          ? await opts.bypass(req, res, opts)
          : null;

      if (bypassUrl === false) {
        res.statusCode = HttpCode.NotFound;
        next();
      } else if (typeof bypassUrl === 'string') {
        req.url = bypassUrl;
        next();
      } else if (bypassUrl === true) {
        next();
      } else {
        (proxyMiddleware as Middleware)(req, res, next);
      }
    };

    middlewares.push(middleware);

    // only proxy WebSocket request when user specified
    // fix WebSocket error when user forget filter HMR path
    if (opts.ws) {
      proxyMiddlewares.push(proxyMiddleware);
    }
  }

  const handleUpgrade: UpgradeEvent = (req, socket, head) => {
    for (const middleware of proxyMiddlewares) {
      if (typeof middleware.upgrade === 'function') {
        middleware.upgrade(req, socket, head);
      }
    }
  };

  return {
    middlewares,
    upgrade: handleUpgrade,
  };
}
