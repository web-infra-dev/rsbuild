import type { ServerResponse } from 'node:http';
import zlib from 'node:zlib';
import type { CompressOptions, RequestHandler } from '../types';

const ENCODING_REGEX = /\bgzip\b/;
const CONTENT_TYPE_REGEX = /text|javascript|\/json|xml/i;

const shouldCompress = (res: ServerResponse) => {
  // already compressed
  if (res.getHeader('Content-Encoding')) {
    return false;
  }

  const contentType = String(res.getHeader('Content-Type'));
  if (contentType && !CONTENT_TYPE_REGEX.test(contentType)) {
    return false;
  }

  const size = res.getHeader('Content-Length');
  return size === undefined || Number(size) > 1024;
};

export const gzipMiddleware = ({
  filter,
  level = zlib.constants.Z_BEST_SPEED,
}: CompressOptions = {}): RequestHandler =>
  function gzipMiddleware(req, res, next): void {
    if (filter && !filter(req, res)) {
      next();
      return;
    }

    const accept = req.headers['accept-encoding'];
    const encoding = typeof accept === 'string' && ENCODING_REGEX.test(accept);

    if (req.method === 'HEAD' || !encoding) {
      next();
      return;
    }

    let gzip: zlib.Gzip | undefined;
    let writeHeadStatus: number | undefined;
    let started = false;

    const on = res.on.bind(res);
    const end = res.end.bind(res);
    const write = res.write.bind(res);
    const writeHead = res.writeHead.bind(res);
    const listeners: [string | symbol, (...args: any[]) => void][] = [];

    const start = () => {
      if (started) {
        return;
      }
      started = true;

      if (shouldCompress(res)) {
        res.setHeader('Content-Encoding', 'gzip');
        res.removeHeader('Content-Length');

        gzip = zlib.createGzip({ level });

        gzip.on('data', (chunk) => {
          if (!write(chunk)) {
            gzip!.pause();
          }
        });

        on('drain', () => gzip!.resume());

        gzip.on('end', () => {
          end();
        });

        for (const listener of listeners) {
          gzip.on.apply(gzip, listener);
        }
      } else {
        for (const listener of listeners) {
          on.apply(res, listener);
        }
      }

      writeHead(writeHeadStatus ?? res.statusCode);
    };

    res.writeHead = (status, reason, headers?) => {
      if (typeof reason === 'string') {
        if (headers) {
          for (const [key, value] of Object.entries(headers)) {
            res.setHeader(key, value);
          }
        }
        res.statusMessage = reason;
      } else if (reason) {
        for (const [key, value] of Object.entries(reason)) {
          if (value !== undefined) {
            res.setHeader(key, value);
          }
        }
      }
      writeHeadStatus = status;
      return res;
    };

    res.write = (...args: unknown[]) => {
      start();
      return gzip
        ? gzip.write(...(args as Parameters<typeof write>))
        : write.apply(res, args as Parameters<typeof write>);
    };

    res.end = (...args: any[]) => {
      start();
      return gzip
        ? (gzip.end as unknown as typeof end)(...args)
        : end.apply(res, args as Parameters<typeof end>);
    };

    res.on = (type, listener) => {
      if (started) {
        if (!gzip || type !== 'drain') {
          on(type, listener);
        } else {
          gzip.on(type, listener);
        }
      } else {
        // store listeners until start
        listeners.push([type, listener]);
      }
      return res;
    };

    next();
  };
