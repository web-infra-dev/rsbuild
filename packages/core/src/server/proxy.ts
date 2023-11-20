import http from 'http';
import {
  createProxyMiddleware as baseCreateProxyMiddleware,
  RequestHandler,
} from '@rsbuild/shared/http-proxy-middleware';
import {
  logger,
  type ProxyDetail,
  type RequestHandler as Middleware,
  type RsbuildProxyOptions,
} from '@rsbuild/shared';

export function formatProxyOptions(proxyOptions: RsbuildProxyOptions) {
  const ret: ProxyDetail[] = [];

  if (Array.isArray(proxyOptions)) {
    ret.push(...proxyOptions);
  } else if ('target' in proxyOptions) {
    ret.push(proxyOptions);
  } else {
    for (const [context, options] of Object.entries(proxyOptions)) {
      const opts: ProxyDetail = {
        context,
        changeOrigin: true,
        logLevel: 'warn',
      };
      if (typeof options === 'string') {
        opts.target = options;
      } else {
        Object.assign(opts, options);
      }
      ret.push(opts);
    }
  }

  const handleError = (err: unknown) => logger.error(err);

  for (const opts of ret) {
    opts.onError ??= handleError;
  }

  return ret;
}

export type HttpUpgradeHandler = NonNullable<RequestHandler['upgrade']>;

export const createProxyMiddleware = (
  proxyOptions: RsbuildProxyOptions,
  app: http.Server,
) => {
  // If it is not an array, it may be an object that uses the context attribute
  // or an object in the form of { source: ProxyDetail }
  const formattedOptionsList = formatProxyOptions(proxyOptions);
  const proxyMiddlewares: RequestHandler[] = [];
  const middlewares: Middleware[] = [];

  for (const opts of formattedOptionsList) {
    const proxyMiddleware = baseCreateProxyMiddleware(opts.context!, opts);

    const middleware: Middleware = async (req, res, next) => {
      const bypassUrl =
        typeof opts.bypass === 'function' ? opts.bypass(req, res, opts) : null;

      if (bypassUrl === false) {
        res.statusCode = 404;
        next();
      } else if (typeof bypassUrl === 'string') {
        req.url = bypassUrl;
        next();
      } else {
        (proxyMiddleware as Middleware)(req, res, next);
      }
    };

    middlewares.push(middleware);
    proxyMiddlewares.push(proxyMiddleware);
  }

  const handleUpgrade: HttpUpgradeHandler = (req, socket, head) => {
    for (const middleware of proxyMiddlewares) {
      if (typeof middleware.upgrade === 'function') {
        middleware.upgrade(req, socket, head);
      }
    }
  };

  app.on('upgrade', handleUpgrade);

  return { middlewares };
};
