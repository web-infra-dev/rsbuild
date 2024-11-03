import type { IncomingMessage } from 'node:http';
import path from 'node:path';
import type Connect from 'connect';
import color from 'picocolors';
import { addTrailingSlash } from '../helpers';
import { logger } from '../logger';
import type {
  HtmlFallback,
  RequestHandler as Middleware,
  Rspack,
} from '../types';
import { joinUrlSegments, stripBase } from './helper';

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
 * handle `server.base`
 */
export const getBaseMiddleware: (params: { base: string }) => Middleware = ({
  base,
}) => {
  return async (req, res, next) => {
    const url = req.url!;
    const pathname = getUrlPathname(url);

    if (pathname.startsWith(base)) {
      req.url = stripBase(url, base);
      return next();
    }

    const redirectPath =
      addTrailingSlash(url) !== base ? joinUrlSegments(base, url) : base;

    if (pathname === '/' || pathname === '/index.html') {
      // redirect root visit to based url with search and hash
      res.writeHead(302, {
        Location: redirectPath,
      });
      res.end();
      return;
    }

    // non-based page visit
    if (req.headers.accept?.includes('text/html')) {
      res.writeHead(404, {
        'Content-Type': 'text/html',
      });
      res.end(
        `The server is configured with a base URL of ${base} - ` +
          `did you mean to visit <a href="${redirectPath}">${redirectPath}</a> instead?`,
      );
      return;
    }

    // not found for resources
    res.writeHead(404, {
      'Content-Type': 'text/plain',
    });
    res.end(
      `The server is configured with a base URL of ${base} - ` +
        `did you mean to visit ${redirectPath} instead?`,
    );
    return;
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

export const viewerFilesMiddleware: (params: {
  distPath: string;
  outputFileSystem: Rspack.OutputFileSystem;
}) => Middleware =
  ({ outputFileSystem, distPath }) =>
  async (req, res, next) => {
    console.log('%c Line:256 🥟 req.url', 'color:#93c0a4', req.url);
    if (req.url === '/rspack-dev-server') {
      const processDirectory = async (
        directory: string,
        list: string[] = [],
      ): Promise<string[]> => {
        try {
          const items: string[] = await new Promise((resolve, reject) => {
            outputFileSystem.readdir(directory, (err, results) => {
              if (err) {
                reject(err);
              } else {
                resolve(results as string[]);
              }
            });
          });

          for (const item of items) {
            const fullPath = path.join(directory, item);
            const stats = (await new Promise((resolve, reject) => {
              outputFileSystem.stat(fullPath, (err, stats) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(stats as any);
                }
              });
            })) as any;

            if (stats?.isDirectory()) {
              await processDirectory(fullPath, list);
            } else {
              list.push(
                `<li><a href="${fullPath.replace(distPath, '')}">${item}</a></li>`,
              ); // Format path into hyperlink inside <li>
            }
          }
          return list;
        } catch (e) {
          // throw new Error("Failed to read directory: " + e);
          return [];
        }
      };

      try {
        const files = await processDirectory(distPath);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<!DOCTYPE html><html>
        <h1>Assets Report:</h1>
        <body><ul>${files.join('')}</ul></body></html>`); // Return as HTML document
      } catch (err) {
        console.error('Error listing files:', err);
        res.writeHead(500);
        res.end('Failed to list the files');
      }
    } else {
      next();
    }
  };
