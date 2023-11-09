import http from 'http';
import { RequestHandler } from 'http-proxy-middleware';
import { HttpProxyMiddleware } from 'http-proxy-middleware/dist/http-proxy-middleware';
import {
  ProxyDetail,
  RequestHandler as Middleware,
  RsbuildProxyOptions,
} from '@rsbuild/shared';
import type { OnErrorCallback } from 'http-proxy-middleware/dist/types';

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

  const handleError: OnErrorCallback = (err, _req, _res, _target) => {
    console.error(err);
  };
  for (const opts of ret) {
    opts.onError ??= handleError;
  }

  return ret;
}

export type HttpUpgradeHandler = NonNullable<RequestHandler['upgrade']>;

export const createProxyMiddleware = (proxyOptions: RsbuildProxyOptions) => {
  // If it is not an array, it may be an object that uses the context attribute
  // or an object in the form of { source: ProxyDetail }
  const formattedOptionsList = formatProxyOptions(proxyOptions);
  const proxies: HttpProxyMiddleware[] = [];
  const middlewares: Middleware[] = [];

  for (const opts of formattedOptionsList) {
    const proxy = new HttpProxyMiddleware(opts.context!, opts);
    const middleware: Middleware = async (req, res, next) => {
      const bypassUrl =
        typeof opts.bypass === 'function' ? opts.bypass(req, res, opts) : null;
      // only false, no true
      if (typeof bypassUrl === 'boolean') {
        res.statusCode = 404;
        next();
      } else if (typeof bypassUrl === 'string') {
        req.url = bypassUrl;
        next();
      } else {
        proxy.middleware(req as any, res as any, next);
      }
    };
    proxies.push(proxy);
    middlewares.push(middleware);
  }

  const handleUpgrade = (server: http.Server) => {
    for (const proxy of proxies) {
      const raw = proxy as any;
      /** {@link https://github.com/chimurai/http-proxy-middleware/blob/d7aa01de280d598537735733070ad06d9ea608dd/src/http-proxy-middleware.ts#L73-L76} */
      if (raw.proxyOptions.ws === true && !raw.wsInternalSubscribed) {
        server.on('upgrade', raw.handleUpgrade);
        raw.wsInternalSubscribed = true;
      }
    }
  };

  return { middlewares, handleUpgrade };
};
