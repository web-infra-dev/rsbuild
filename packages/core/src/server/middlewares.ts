import type { IncomingMessage } from 'node:http';
import path from 'node:path';
import { addTrailingSlash, color, getAssetsFromStats } from '../helpers';
import { logger } from '../logger';
import type {
  Connect,
  EnvironmentAPI,
  HtmlFallback,
  RequestHandler,
  Rspack,
} from '../types';
import type { CompilationManager } from './compilationManager';
import { joinUrlSegments, stripBase } from './helper';

export const faviconFallbackMiddleware: RequestHandler = (req, res, next) => {
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
    const { default: onFinished } = await import(
      '../../compiled/on-finished/index.js'
    );

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

export const notFoundMiddleware: RequestHandler = (_req, res, _next) => {
  res.statusCode = 404;
  res.end();
};

export const optionsFallbackMiddleware: RequestHandler = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    // Use 204 as no content to send in the response body
    res.statusCode = 204;
    res.setHeader('Content-Length', '0');
    res.end();
    return;
  }
  next();
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
  compilationManager: CompilationManager;
}) => RequestHandler = ({ distPath, compilationManager }) => {
  return async (req, res, next) => {
    if (!maybeHTMLRequest(req)) {
      next();
      return;
    }

    const url = req.url!;
    const pathname = getUrlPathname(url);

    const rewrite = (newUrl: string) => {
      req.url = newUrl;
      compilationManager.middleware(req, res, (...args) => {
        next(...args);
      });
      return;
    };

    // '/' => '/index.html'
    if (pathname.endsWith('/')) {
      const newUrl = `${pathname}index.html`;
      const filePath = path.join(distPath, newUrl);

      if (await isFileExists(filePath, compilationManager.outputFileSystem)) {
        rewrite(newUrl);
        return;
      }
    }
    // '/main' => '/main.html'
    else if (!path.extname(pathname)) {
      const newUrl = `${pathname}.html`;
      const filePath = path.join(distPath, newUrl);

      if (await isFileExists(filePath, compilationManager.outputFileSystem)) {
        rewrite(newUrl);
        return;
      }
    }

    next();
  };
};

/**
 * handle `server.base`
 */
export const getBaseMiddleware: (params: {
  base: string;
}) => RequestHandler = ({ base }) => {
  return async (req, res, next) => {
    const url = req.url!;
    const pathname = getUrlPathname(url);

    if (pathname.startsWith(base)) {
      req.url = stripBase(url, base);
      next();
      return;
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
  compilationManager: CompilationManager;
  htmlFallback?: HtmlFallback;
}) => RequestHandler = ({ htmlFallback, distPath, compilationManager }) => {
  return async (req, res, next) => {
    if (
      !maybeHTMLRequest(req) ||
      '/favicon.ico' === req.url ||
      htmlFallback !== 'index'
    ) {
      next();
      return;
    }

    const filePath = path.join(distPath, 'index.html');
    if (await isFileExists(filePath, compilationManager.outputFileSystem)) {
      const newUrl = '/index.html';

      if (logger.level === 'verbose') {
        logger.debug(
          `${req.method} ${color.gray(
            `${req.url} ${color.yellow('fallback')} to ${newUrl}`,
          )}`,
        );
      }

      req.url = newUrl;
      compilationManager.middleware(req, res, (...args) => {
        next(...args);
      });
      return;
    }

    next();
  };
};

/**
 * Support viewing served files via `/rsbuild-dev-server` route
 */
export const viewingServedFilesMiddleware: (params: {
  environments: EnvironmentAPI;
}) => RequestHandler =
  ({ environments }) =>
  async (req, res, next) => {
    const url = req.url!;
    const pathname = getUrlPathname(url);

    if (pathname !== '/rsbuild-dev-server') {
      next();
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.write(
      `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        margin: 0;
        color: #f6f7f9;
        padding: 32px 40px;
        line-height: 1.8;
        min-height: 100vh;
        background-image: linear-gradient(#020917, #101725);
        font-family: ui-sans-serif,system-ui,sans-serif;
      }
      h1, h2 {
        font-weight: 500;
      }
      h1 {
        margin: 0;
        font-size: 36px;
      }
      h2 {
        font-size: 20px;
        margin: 24px 0 16px;
      }
      ul {
        margin: 0;
        padding-left: 16px;
      }
      a {
        color: #58c4dc;
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
    </style>
  </head>
  <body>
    <h1>Assets Report</h1>
  </body>
</html>`,
    );

    try {
      for (const key in environments) {
        res.write(`<h2>Environment: ${key}</h2>`);

        const list = [];
        const environment = environments[key];
        const stats = await environment.getStats();
        const assets = getAssetsFromStats(stats);

        res.write('<ul>');

        for (const asset of assets) {
          list.push(
            `<li><a target="_blank" href="${asset?.name}">${asset?.name}</a></li>`,
          );
        }

        res.write(list?.join(''));
        res.write('</ul>');
      }
      res.end('</body></html>');
    } catch (err) {
      logger.error(err);
      res.writeHead(500);
      res.end('Failed to list the files');
    }
  };
