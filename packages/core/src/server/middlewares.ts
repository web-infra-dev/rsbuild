import type fs from 'node:fs';
import path from 'node:path';
import { parse } from 'node:url';
import {
  type HtmlFallback,
  type RequestHandler as Middleware,
  color,
  debug,
  isDebug,
  logger,
} from '@rsbuild/shared';
import type { NextHandleFunction } from '@rsbuild/shared/connect';

export const faviconFallbackMiddleware: Middleware = (req, res, next) => {
  if (req.url === '/favicon.ico') {
    res.statusCode = 204;
    res.end();
  } else {
    next();
  }
};

const getStatusCodeColor = (status: number) => {
  if (status >= 500) {
    return color.red;
  }
  if (status >= 400) {
    return color.yellow;
  }
  if (status >= 300) {
    return color.cyan;
  }
  if (status >= 200) {
    return color.green;
  }
  return (res: number) => res;
};

export const getRequestLoggerMiddleware: () => Promise<NextHandleFunction> =
  async () => {
    const { default: onFinished } = await import('../../compiled/on-finished');

    return (req, res, next) => {
      const _startAt = process.hrtime();

      const logRequest = () => {
        const method = req.method;
        const url = req.originalUrl || req.url;
        const status = Number(res.statusCode);

        // get status color
        const statusColor = getStatusCodeColor(status);

        const endAt = process.hrtime();

        const totalTime =
          (endAt[0] - _startAt[0]) * 1e3 + (endAt[1] - _startAt[1]) * 1e-6;

        // :status :method :url :total-time ms
        debug(
          `${statusColor(status)} ${method} ${color.gray(url)} ${color.gray(
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
  outputFileSystem: typeof fs;
}) => Middleware = ({ htmlFallback, distPath, callback, outputFileSystem }) => {
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

    const rewrite = (newUrl: string, isFallback = false) => {
      if (isFallback && isDebug()) {
        debug(
          `${req.method} ${color.gray(
            `${req.url} ${color.yellow('fallback')} to ${newUrl}`,
          )}`,
        );
      }

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
