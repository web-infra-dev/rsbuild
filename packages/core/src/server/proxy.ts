import type { RequestHandler } from '../../compiled/http-proxy-middleware/index.js';
import { requireCompiledPackage } from '../helpers/index.js';
import { logger } from '../logger';
import type {
  RequestHandler as Middleware,
  ProxyConfig,
  ProxyOptions,
} from '../types';
import type { UpgradeEvent } from './helper';

function formatProxyOptions(proxyOptions: ProxyConfig) {
  const ret: ProxyOptions[] = [];

  if (Array.isArray(proxyOptions)) {
    ret.push(...proxyOptions);
  } else if ('target' in proxyOptions) {
    ret.push(proxyOptions);
  } else {
    for (const [context, options] of Object.entries(proxyOptions)) {
      const opts: ProxyOptions = {
        context,
        changeOrigin: true,
        logLevel: 'warn',
        logProvider: () => logger,
      };
      if (typeof options === 'string') {
        opts.target = options;
      } else {
        Object.assign(opts, options);
      }
      ret.push(opts);
    }
  }

  return ret;
}

export const createProxyMiddleware = async (
  proxyOptions: ProxyConfig,
): Promise<{
  middlewares: Middleware[];
  upgrade: UpgradeEvent;
}> => {
  // If it is not an array, it may be an object that uses the context attribute
  // or an object in the form of { source: ProxyDetail }
  const formattedOptions = formatProxyOptions(proxyOptions);
  const proxyMiddlewares: RequestHandler[] = [];
  const middlewares: Middleware[] = [];

  const { createProxyMiddleware: baseMiddleware } = requireCompiledPackage(
    'http-proxy-middleware',
  );

  for (const opts of formattedOptions) {
    const { onProxyRes } = opts;

    /**
     * Fix SSE close events
     * Can be removed after updating to http-proxy-middleware v3
     * @link https://github.com/chimurai/http-proxy-middleware/issues/678
     * @link https://github.com/http-party/node-http-proxy/issues/1520#issue-877626125
     */
    opts.onProxyRes = (proxyRes, _req, res) => {
      // call user's onProxyRes if provided
      if (onProxyRes) {
        onProxyRes(proxyRes, _req, res);
      }
      res.on('close', () => {
        if (!res.writableEnded) {
          proxyRes.destroy();
        }
      });
    };

    const proxyMiddleware = baseMiddleware(opts.context!, opts);

    const middleware: Middleware = async (req, res, next) => {
      const bypassUrl =
        typeof opts.bypass === 'function'
          ? await opts.bypass(req, res, opts)
          : null;

      if (bypassUrl === false) {
        res.statusCode = 404;
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
    opts.ws && proxyMiddlewares.push(proxyMiddleware);
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
};
