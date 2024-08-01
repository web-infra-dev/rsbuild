import type { OutgoingHttpHeader } from 'node:http';
import zlib from 'node:zlib';
import { castArray } from 'src/helpers';
import type { RequestHandler } from '../types';

const ENCODING_REGEX = /\bgzip\b/;
const CONTENT_TYPE_REGEX = /text|javascript|\/json|xml/i;

export const gzipMiddleware: RequestHandler = (req, res, next): void => {
  const accept = req.headers['accept-encoding'];
  const encoding = typeof accept === 'string' && ENCODING_REGEX.test(accept);

  if (req.method === 'HEAD' || !encoding) {
    next();
    return;
  }

  let compress: zlib.Gzip | undefined;
  let writeHeadStatus: number | undefined;
  let started = false;
  let listeners: Array<[string | symbol, (...args: any[]) => void]> | null = [];

  const { end, write, on, writeHead } = res;

  const start = () => {
    if (started) {
      return;
    }
    started = true;

    const contentType = String(res.getHeader('Content-Type'));
    const compressible = contentType
      ? CONTENT_TYPE_REGEX.test(contentType)
      : true;

    if (compressible && !res.getHeader('Content-Encoding')) {
      res.setHeader('Content-Encoding', 'gzip');
      res.removeHeader('Content-Length');

      compress = zlib.createGzip({ level: 1 });

      compress.on('data', (chunk) => {
        if ((write as (chunk: unknown) => boolean).call(res, chunk) === false) {
          compress!.pause();
        }
      });

      on.call(res, 'drain', () => compress!.resume());

      compress.on('end', () => {
        (end as () => void).call(res);
      });

      if (listeners) {
        for (const listener of listeners) {
          compress.on.apply(compress, listener);
        }
      }
    } else if (listeners) {
      for (const listener of listeners) {
        on.apply(res, listener);
      }
      listeners = null;
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
    return compress
      ? compress.write(...(args as Parameters<typeof write>))
      : write.apply(res, args as Parameters<typeof write>);
  };

  res.end = (...args: any[]) => {
    start();
    return compress
      ? (compress.end as unknown as typeof end)(...args)
      : end.apply(res, args as Parameters<typeof end>);
  };

  res.on = (type, listener) => {
    if (listeners === null || type !== 'drain') {
      on.call(res, type, listener);
    } else if (compress) {
      compress.on(type, listener);
    } else {
      listeners.push([type, listener]);
    }
    return res;
  };

  next();
};
