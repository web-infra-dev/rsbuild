import {
  RequestHandler as Middleware,
  debug,
  urlJoin,
  HtmlFallback,
} from '@rsbuild/shared';
import path from 'path';
import fs from 'fs';

export const faviconFallbackMiddleware: Middleware = (req, res, next) => {
  if (req.url === '/favicon.ico') {
    res.statusCode = 204;
    res.end();
  } else {
    next();
  }
};

export const notFoundMiddleware: Middleware = (_req, res, _next) => {
  res.statusCode = 404;
  res.end();
};

export const getHtmlFallbackMiddleware: (params: {
  distPath: string;
  publicPath: string;
  callback?: Middleware;
  htmlFallback?: HtmlFallback;
}) => Middleware = ({ htmlFallback, publicPath, distPath, callback }) => {
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
    const pathname = decodeURIComponent(url);

    let outputFileSystem = fs;

    // support memory fs
    // @ts-expect-error
    if (res.locals.webpack) {
      // reference: https://github.com/webpack/webpack-dev-middleware#server-side-rendering
      // @ts-expect-error
      const { devMiddleware } = res.locals.webpack;
      outputFileSystem = devMiddleware.outputFileSystem;
    }

    const rewrite = (newUrl: string) => {
      // we need add assetPrefix(output.publicPath) for html, otherwise webpack-dev-middleware cannot find the file
      newUrl = urlJoin(publicPath, newUrl);
      debug?.(`Rewriting ${req.method} ${req.url} to ${newUrl}`);

      req.url = newUrl;

      if (callback) {
        return callback(req, res, (...args) => {
          next(...args);
        });
      } else {
        return next();
      }
    };

    // '/' => '/index.html'
    if (pathname.endsWith('/')) {
      const newUrl = url + 'index.html';
      const filePath = path.join(distPath, pathname, 'index.html');

      if (outputFileSystem.existsSync(filePath)) {
        return rewrite(newUrl);
      }
    } else if (
      // '/main' => '/main.html'
      !pathname.endsWith('.html')
    ) {
      const newUrl = url + '.html';
      const filePath = path.join(distPath, pathname + '.html');

      if (outputFileSystem.existsSync(filePath)) {
        return rewrite(newUrl);
      }
    } else {
      // when user set publicPath, webpack-dev-middleware can't get html file directly.
      if (outputFileSystem.existsSync(path.join(distPath, pathname))) {
        return rewrite(url);
      }
    }

    if (htmlFallback === 'index') {
      if (outputFileSystem.existsSync(path.join(distPath, 'index.html'))) {
        return rewrite('/index.html');
      }
    }

    next();
  };
};
