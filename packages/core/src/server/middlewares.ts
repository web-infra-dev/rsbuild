import type { IncomingMessage } from 'node:http';
import path from 'node:path';
import type Connect from 'connect';
import color from 'picocolors';
import { logger } from '../logger';
import type {
  HtmlFallback,
  RequestHandler as Middleware,
  Rspack,
} from '../types';

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

export const getRequestLoggerMiddleware: () => Promise<Connect.NextHandleFunction> =
  async () => {
    const { default: onFinished } = await import('on-finished');

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
        logger.debug(
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

const isFileExists = async (
  filePath: string,
  outputFileSystem: Rspack.OutputFileSystem,
) =>
  new Promise((resolve) => {
    outputFileSystem.stat(filePath, (_error, stats) => {
      resolve(stats?.isFile());
    });
  });

const maybeHTMLRequest = (req: IncomingMessage) => {
  if (
    // require headers and url
    !req.url ||
    !req.headers ||
    // only accept GET or HEAD
    (req.method !== 'GET' && req.method !== 'HEAD')
  ) {
    return false;
  }

  const { accept } = req.headers;
  // accept should be `text/html` or `*/*`
  return (
    typeof accept === 'string' &&
    (accept.includes('text/html') || accept.includes('*/*'))
  );
};

const postfixRE = /[?#].*$/;

const getUrlPathname = (url: string): string => {
  return url.replace(postfixRE, '');
};

/**
 * Support access HTML without suffix
 */
export const getHtmlCompletionMiddleware: (params: {
  distPath: string;
  callback: Middleware;
  outputFileSystem: Rspack.OutputFileSystem;
}) => Middleware = ({ distPath, callback, outputFileSystem }) => {
  return async (req, res, next) => {
    if (!maybeHTMLRequest(req)) {
      return next();
    }

    const url = req.url!;

    const pathname = getUrlPathname(url);

    const rewrite = (newUrl: string) => {
      req.url = newUrl;
      return callback(req, res, (...args) => {
        next(...args);
      });
    };

    // '/' => '/index.html'
    if (pathname.endsWith('/')) {
      const newUrl = `${pathname}index.html`;
      const filePath = path.join(distPath, newUrl);

      if (await isFileExists(filePath, outputFileSystem)) {
        return rewrite(newUrl);
      }
    }
    // '/main' => '/main.html'
    else if (!path.extname(pathname)) {
      const newUrl = `${pathname}.html`;
      const filePath = path.join(distPath, newUrl);

      if (await isFileExists(filePath, outputFileSystem)) {
        return rewrite(newUrl);
      }
    }

    next();
  };
};

/**
 * support HTML fallback in some edge cases
 */
export const getHtmlFallbackMiddleware: (params: {
  distPath: string;
  callback: Middleware;
  htmlFallback?: HtmlFallback;
  outputFileSystem: Rspack.OutputFileSystem;
}) => Middleware = ({ htmlFallback, distPath, callback, outputFileSystem }) => {
  return async (req, res, next) => {
    if (
      !maybeHTMLRequest(req) ||
      '/favicon.ico' === req.url ||
      htmlFallback !== 'index'
    ) {
      return next();
    }

    const filePath = path.join(distPath, 'index.html');
    if (await isFileExists(filePath, outputFileSystem)) {
      const newUrl = '/index.html';

      if (logger.level === 'verbose') {
        logger.debug(
          `${req.method} ${color.gray(
            `${req.url} ${color.yellow('fallback')} to ${newUrl}`,
          )}`,
        );
      }

      req.url = newUrl;
      return callback(req, res, (...args) => next(...args));
    }

    next();
  };
};
