import zlib from 'node:zlib';
import type { RequestHandler } from '../types';
import type { OutgoingHttpHeaders } from 'node:http';
import { castArray } from 'src/helpers';

const MIME_REGEX = /text|javascript|\/json|xml/i;
const GZIP_REGEX = /\bgzip\b/;

export const compressMiddleware: RequestHandler = (req, res, next): void => {
  const accept = req.headers['accept-encoding'];
  const encoding = typeof accept === 'string' && GZIP_REGEX.test(accept);

  if (req.method === 'HEAD' || !encoding) {
    next();
    return;
  }

  const compress = zlib.createGzip({ level: 1 });

  let pendingStatus: number | undefined;
  let started = false;

  const { end, write, on, writeHead } = res;

  function start() {
    started = true;

    const contentType = String(res.getHeader('Content-Type'));
    const compressible = contentType ? MIME_REGEX.test(contentType) : true;

    if (compressible && !res.getHeader('Content-Encoding')) {
      res.setHeader('Content-Encoding', 'gzip');
      res.removeHeader('Content-Length');

      compress.on('data', (chunk) => {
        // @ts-ignore
        if (write.call(res, chunk) === false) {
          compress.pause();
        }
      });

      on.call(res, 'drain', () => compress.resume());

      // @ts-ignore
      compress.on('end', () => end.call(res));
    }

    writeHead.call(res, pendingStatus || res.statusCode);
  }

  res.writeHead = function (status, reason, headers?) {
    const finalHeaders = castArray(
      typeof reason === 'string' ? headers : reason,
    );

    if (typeof reason !== 'string') {
      // @ts-ignore
      [headers, reason] = [reason, headers];
    }
    // @ts-ignore
    if (headers) for (const i in headers) res.setHeader(i, headers[i]);
    pendingStatus = status;
    return this;
  };

  res.write = (...args) => {
    if (!started) start();
    // @ts-ignore
    return compress.write(...args);
  };

  // @ts-ignore
  res.end = (...args) => {
    if (!started) start();
    // @ts-ignore
    return compress.end(...args);
  };

  res.on = function (type, listener) {
    compress.on(type, listener);
    return this;
  };

  next();
};
