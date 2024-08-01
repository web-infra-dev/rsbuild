import type { OutgoingHttpHeader, ServerResponse } from 'node:http';
import zlib from 'node:zlib';
import { castArray } from 'src/helpers';
import type { RequestHandler } from '../types';

const ENCODING_REGEX = /\bgzip\b/;
const CONTENT_TYPE_REGEX = /text|javascript|\/json|xml/i;

const shouldCompress = (res: ServerResponse) => {
  if (res.getHeader('Content-Encoding')) {
    return false;
  }

  const contentType = String(res.getHeader('Content-Type'));
  if (contentType && !CONTENT_TYPE_REGEX.test(contentType)) {
    return false;
  }

  const size = res.getHeader('Content-Length');
  return size !== undefined && Number(size) > 1024;
};

export const gzipMiddleware: RequestHandler = (req, res, next): void => {
  const accept = req.headers['accept-encoding'];
  const encoding = typeof accept === 'string' && ENCODING_REGEX.test(accept);

  if (req.method === 'HEAD' || !encoding) {
    next();
    return;
  }

  let gzip: zlib.Gzip | undefined;
  let writeHeadStatus: number | undefined;
  let started = false;
  const listeners: Array<[string | symbol, (...args: any[]) => void]> = [];

  const { end, write, on, writeHead } = res;

  const start = () => {
    if (started) {
      return;
    }
    started = true;

    if (shouldCompress(res)) {
      res.setHeader('Content-Encoding', 'gzip');
      res.removeHeader('Content-Length');

      gzip = zlib.createGzip({ level: zlib.constants.Z_BEST_SPEED });

      gzip.on('data', (chunk) => {
        if ((write as (chunk: unknown) => boolean).call(res, chunk) === false) {
          gzip!.pause();
        }
      });

      on.call(res, 'drain', () => gzip!.resume());

      gzip.on('end', () => {
        (end as () => void).call(res);
      });

      for (const listener of listeners) {
        gzip.on.apply(gzip, listener);
      }
    } else {
      for (const listener of listeners) {
        on.apply(res, listener);
      }
    }

    writeHead.call(res, writeHeadStatus || res.statusCode);
  };

  res.writeHead = (status, reason, optionalHeaders?) => {
    if (reason) {
      const headers = castArray(
        typeof reason === 'string' ? optionalHeaders : reason,
      ) as OutgoingHttpHeader[];

      for (const index in headers) {
        res.setHeader(index, headers[index]);
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
    if (!gzip || type !== 'drain') {
      on.call(res, type, listener);
    } else if (gzip) {
      gzip.on(type, listener);
    } else {
      listeners.push([type, listener]);
    }
    return res;
  };

  next();
};
