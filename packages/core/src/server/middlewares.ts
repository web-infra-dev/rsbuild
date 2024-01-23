import {
  color,
  debug,
  logger,
  type HtmlFallback,
  type RequestHandler as Middleware,
} from '@rsbuild/shared';
import { parse } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

export const faviconFallbackMiddleware: Middleware = (req, res, next) => {
  if (req.url === '/favicon.ico') {
    res.statusCode = 204;
    res.end();
  } else {
    next();
  }
};

export const getRequestLoggerMiddleware: () => Promise<Middleware> =
  async () => {
    const { default: onFinished } = await import('on-finished');

    return (req, res, next) => {
      const _startAt = process.hrtime();

      const logRequest = () => {
        const method = req.method;
        const url: string = (req as any).originalUrl || req.url;
        const status = Number(res.statusCode);

        // get status color
        const statusColor =
          status >= 500
            ? color.red
            : status >= 400
            ? color.yellow
            : status >= 300
            ? color.cyan
            : status >= 200
            ? color.green
            : (res: number) => res;

        const endAt = process.hrtime();

        const totalTime =
          (endAt[0] - _startAt[0]) * 1e3 + (endAt[1] - _startAt[1]) * 1e-6;

        // :method :url :status :total-time ms
        logger.debug(
          `${method} ${color.gray(url)} ${statusColor(status)} ${color.gray(
            `${totalTime.toFixed(3)} ms`,
          )}`,
        );
      };

      onFinished(res, logRequest);

      next();
    };
  };

export const notFoundMiddleware: Middleware = (_req, res, _next) => {
  res.statusCode = 404;
  res.end();
};

export const getHtmlFallbackMiddleware: (params: {
  distPath: string;
  callback?: Middleware;
  htmlFallback?: HtmlFallback;
}) => Middleware = ({ htmlFallback, distPath, callback }) => {
  /**
   * support access page without suffix and support fallback in some edge cases
   */
  return (req, res, next) => {
    if (
      // Only accept GET or HEAD
      (req.method !== 'GET' && req.method !== 'HEAD') ||
      // Require Accept header
      !req.headers ||
      typeof req.headers.accept !== 'string' ||
      // Ignore JSON requests
      req.headers.accept.includes('application/json') ||
      // Require Accept: text/html or */*
      !(
        req.headers.accept.includes('text/html') ||
        req.headers.accept.includes('*/*')
      ) ||
      !req.url ||
      ['/favicon.ico'].includes(req.url)
    ) {
      return next();
    }

    const { url } = req;
    let pathname = url;

    // Handle invalid URLs
    try {
      pathname = parse(url, false, true).pathname!;
    } catch (err) {
      logger.error(
        new Error(`Invalid URL: ${color.yellow(url)}`, { cause: err }),
      );
      return next();
    }

    let outputFileSystem = fs;

    // support memory fs
    // @ts-expect-error
    if (res.locals.webpack) {
      // reference: https://github.com/webpack/webpack-dev-middleware#server-side-rendering
      // @ts-expect-error
      const { devMiddleware } = res.locals.webpack;
      outputFileSystem = devMiddleware.outputFileSystem;
    }

    const rewrite = (newUrl: string, isFallback = false) => {
      isFallback &&
        debug?.(
          `${color.yellow('Fallback')} ${req.method} ${color.gray(
            `${req.url} to ${newUrl}`,
          )}`,
        );

      req.url = newUrl;

      if (callback) {
        return callback(req, res, (...args) => {
          next(...args);
        });
      }
      return next();
    };

    // '/' => '/index.html'
    if (pathname.endsWith('/')) {
      const newUrl = `${pathname}index.html`;
      const filePath = path.join(distPath, pathname, 'index.html');

      if (outputFileSystem.existsSync(filePath)) {
        return rewrite(newUrl);
      }
    } else if (
      // '/main' => '/main.html'
      !pathname.endsWith('.html')
    ) {
      const newUrl = `${pathname}.html`;
      const filePath = path.join(distPath, `${pathname}.html`);

      if (outputFileSystem.existsSync(filePath)) {
        return rewrite(newUrl);
      }
    }

    if (htmlFallback === 'index') {
      if (outputFileSystem.existsSync(path.join(distPath, 'index.html'))) {
        return rewrite('/index.html', true);
      }
    }

    next();
  };
};
