import type { Stats as FSStats, ReadStream } from 'node:fs';
import type { IncomingMessage } from 'node:http';
import type { Range, Result as RangeResult, Ranges } from 'range-parser';
import rangeParser from 'range-parser';
import onFinishedStream from '../../compiled/on-finished/index.js';
import { logger } from '../logger';
import type {
  FilledContext,
  ServerResponse,
  Middleware as TMiddleware,
} from './index';
import { escapeHtml } from './utils/escapeHtml';
import { getFilenameFromUrl } from './utils/getFilenameFromUrl';
import { memorize } from './utils/memorize';
import { parseTokenList } from './utils/parseTokenList';
import { ready } from './utils/ready';

async function getEtag(stat: FSStats): Promise<string> {
  const mtime = stat.mtime.getTime().toString(16);
  const size = stat.size.toString(16);

  return `W/"${size}-${mtime}"`;
}

type CreateReadStream = (
  p: string,
  opts: { start: number; end: number },
) => ReadStream;

async function getContentType(str: string): Promise<false | string> {
  const { lookup } = await import('../../compiled/mrmime/index.js');
  let mime = lookup(str);
  if (!mime) {
    return false;
  }
  if (
    mime.startsWith('text/') ||
    mime === 'application/json' ||
    mime === 'application/manifest+json'
  ) {
    mime += '; charset=utf-8';
  }
  return mime;
}

const BYTES_RANGE_REGEXP = /^ *bytes/i;

function getValueContentRangeHeader(
  type: string,
  size: number,
  range?: Range,
): string {
  return `${type} ${range ? `${range.start}-${range.end}` : '*'}:${size}`.replace(
    ':',
    '/',
  );
}

function parseHttpDate(date: string): number {
  const timestamp = date && Date.parse(date);
  return typeof timestamp === 'number' ? timestamp : Number.NaN;
}

const CACHE_CONTROL_NO_CACHE_REGEXP = /(?:^|,)\s*?no-cache\s*?(?:,|$)/;

function destroyStream(stream: ReadStream, suppress: boolean): void {
  if (typeof stream.destroy === 'function') {
    stream.destroy();
  }

  if (typeof stream.close === 'function') {
    stream.on('open', function onOpenClose(this: ReadStream) {
      // @ts-ignore
      if (typeof this.fd === 'number') {
        this.close();
      }
    });
  }

  if (typeof stream.addListener === 'function' && suppress) {
    stream.removeAllListeners('error');
    stream.addListener('error', () => {});
  }
}

const statuses: Record<number, string> = {
  400: 'Bad Request',
  403: 'Forbidden',
  404: 'Not Found',
  416: 'Range Not Satisfiable',
  500: 'Internal Server Error',
};

const parseRangeHeaders = memorize((value: string): RangeResult | Ranges => {
  const [len, rangeHeader] = value.split('|');
  return rangeParser(Number(len), rangeHeader, {
    combine: true,
  });
});

type SendErrorOptions = {
  headers?: Record<string, number | string | string[] | undefined>;
};

export function wrapper<
  Request extends IncomingMessage,
  Response extends ServerResponse,
>(context: FilledContext): TMiddleware<Request, Response> {
  return async function middleware(req, res, next) {
    const acceptedMethods = ['GET', 'HEAD'];

    res.locals = res.locals || {};

    async function goNext() {
      return new Promise<void>((resolve) => {
        ready(
          context,
          () => {
            // eslint-disable-next-line no-param-reassign
            // TODO: augment Response type to include `locals`
            (res.locals as any).webpack = { devMiddleware: context };
            resolve(next());
          },
          req,
        );
      });
    }

    if (req.method && !acceptedMethods.includes(req.method)) {
      await goNext();
      return;
    }

    function sendError(
      status: number,
      options?: Partial<SendErrorOptions>,
    ): void {
      const content = statuses[status] || String(status);
      const document = Buffer.from(
        `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Error</title>\n</head>\n<body>\n<pre>${escapeHtml(content)}</pre>\n</body>\n</html>`,
        'utf-8',
      );

      const headers = res.getHeaderNames();
      for (let i = 0; i < headers.length; i++) {
        res.removeHeader(headers[i]);
      }

      if (options?.headers) {
        const keys = Object.keys(options.headers);
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const value = options.headers[key];
          if (typeof value !== 'undefined') {
            res.setHeader(key, value);
          }
        }
      }

      // eslint-disable-next-line no-param-reassign
      res.statusCode = status;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Security-Policy', "default-src 'none'");
      res.setHeader('X-Content-Type-Options', 'nosniff');

      const byteLength = Buffer.byteLength(document);
      res.setHeader('Content-Length', byteLength);
      res.end(document);
    }

    function isConditionalGET() {
      return (
        req.headers['if-match'] ||
        req.headers['if-unmodified-since'] ||
        req.headers['if-none-match'] ||
        req.headers['if-modified-since']
      );
    }

    function isPreconditionFailure() {
      const ifMatch = req.headers['if-match'];

      if (ifMatch) {
        const etag = res.getHeader('ETag');

        return (
          !etag ||
          (ifMatch !== '*' &&
            parseTokenList(ifMatch).every(
              (match: string) =>
                match !== etag &&
                match !== `W/${etag}` &&
                `W/${match}` !== etag,
            ))
        );
      }

      const ifUnmodifiedSince = req.headers['if-unmodified-since'];
      if (ifUnmodifiedSince) {
        const unmodifiedSince = parseHttpDate(ifUnmodifiedSince);
        if (!Number.isNaN(unmodifiedSince)) {
          const lastModified = parseHttpDate(
            String(res.getHeader('Last-Modified')),
          );
          return Number.isNaN(lastModified) || lastModified > unmodifiedSince;
        }
      }

      return false;
    }

    function isCachable(): boolean {
      return (
        (res.statusCode >= 200 && res.statusCode < 300) ||
        res.statusCode === 304
      );
    }

    function isFresh(resHeaders: import('http').OutgoingHttpHeaders): boolean {
      const cacheControl = req.headers['cache-control'];

      if (cacheControl && CACHE_CONTROL_NO_CACHE_REGEXP.test(cacheControl)) {
        return false;
      }

      const noneMatch = req.headers['if-none-match'];
      const modifiedSince = req.headers['if-modified-since'];

      if (!noneMatch && !modifiedSince) {
        return false;
      }

      if (noneMatch && noneMatch !== '*') {
        if (!resHeaders.etag) {
          return false;
        }

        const matches = parseTokenList(noneMatch);
        let etagStale = true;

        for (let i = 0; i < matches.length; i++) {
          const match = matches[i];
          if (
            match === resHeaders.etag ||
            match === `W/${resHeaders.etag}` ||
            `W/${match}` === resHeaders.etag
          ) {
            etagStale = false;
            break;
          }
        }

        if (etagStale) {
          return false;
        }
      }

      if (noneMatch) {
        return true;
      }

      if (modifiedSince) {
        const lastModified = resHeaders['last-modified'];
        const modifiedStale =
          !lastModified ||
          !(
            parseHttpDate(String(lastModified)) <= parseHttpDate(modifiedSince)
          );

        if (modifiedStale) {
          return false;
        }
      }

      return true;
    }

    function isRangeFresh() {
      const ifRange = req.headers['if-range'] as string | undefined;

      if (!ifRange) {
        return true;
      }

      if (ifRange.indexOf('"') !== -1) {
        const etag = res.getHeader('ETag') as string | undefined;
        if (!etag) {
          return true;
        }
        return Boolean(etag && ifRange.indexOf(etag) !== -1);
      }

      const lastModified = res.getHeader('Last-Modified') as string | undefined;
      if (!lastModified) {
        return true;
      }

      return parseHttpDate(lastModified) <= parseHttpDate(ifRange);
    }

    function getRangeHeader(): string | undefined {
      const rage = req.headers.range as string | undefined;
      if (rage && BYTES_RANGE_REGEXP.test(rage)) {
        return rage;
      }
      return undefined;
    }

    function getOffsetAndLenFromRange(range: Range): [number, number] {
      const offset = range.start;
      const len = range.end - range.start + 1;
      return [offset, len];
    }

    function calcStartAndEnd(offset: number, len: number): [number, number] {
      const start = offset;
      const end = Math.max(offset, offset + len - 1);
      return [start, end];
    }

    async function processRequest() {
      const extra: import('./utils/getFilenameFromUrl').Extra = {};
      const filename = getFilenameFromUrl(context, req.url as string, extra);

      if (extra.errorCode) {
        if (extra.errorCode === 403) {
          logger.error(
            `[rsbuild-dev-middleware] Malicious path "${filename}".`,
          );
        }
        sendError(extra.errorCode);
        return;
      }

      if (!filename) {
        await goNext();
        return;
      }

      const { size } = extra.stats as FSStats;
      let len = size;
      let offset = 0;

      if (!res.getHeader('Content-Type')) {
        const contentType = await getContentType(filename);
        if (contentType) {
          res.setHeader('Content-Type', contentType);
        }
      }

      if (!res.getHeader('Accept-Ranges')) {
        res.setHeader('Accept-Ranges', 'bytes');
      }

      if (context.options.lastModified && !res.getHeader('Last-Modified')) {
        const modified = (extra.stats as FSStats).mtime.toUTCString();
        res.setHeader('Last-Modified', modified);
      }

      const rangeHeader = getRangeHeader();

      if (!res.getHeader('ETag')) {
        const value = extra.stats as FSStats;
        if (value) {
          const hash = await getEtag(value);
          res.setHeader('ETag', hash);
        }
      }

      if (isConditionalGET()) {
        if (isPreconditionFailure()) {
          sendError(412);
          return;
        }

        if (res.statusCode === 404) {
          // eslint-disable-next-line no-param-reassign
          res.statusCode = 200;
        }

        if (
          isCachable() &&
          isFresh({
            etag: res.getHeader('ETag') as string | undefined,
            'last-modified': res.getHeader('Last-Modified') as
              | string
              | undefined,
          })
        ) {
          // eslint-disable-next-line no-param-reassign
          res.statusCode = 304;

          res.removeHeader('Content-Encoding');
          res.removeHeader('Content-Language');
          res.removeHeader('Content-Length');
          res.removeHeader('Content-Range');
          res.removeHeader('Content-Type');
          res.end();
          return;
        }
      }

      if (rangeHeader) {
        let parsedRanges: Ranges | RangeResult | [] = parseRangeHeaders(
          `${size}|${rangeHeader}`,
        );

        if (!isRangeFresh()) {
          parsedRanges = [];
        }

        if (parsedRanges === -1) {
          logger.error(
            "[rsbuild-dev-middleware] Unsatisfiable range for 'Range' header.",
          );

          res.setHeader(
            'Content-Range',
            getValueContentRangeHeader('bytes', size),
          );

          sendError(416, {
            headers: {
              'Content-Range': res.getHeader('Content-Range') as any,
            },
          });
          return;
        }
        if (parsedRanges === -2) {
          logger.error(
            "[rsbuild-dev-middleware] A malformed 'Range' header was provided. A regular response will be sent for this request.",
          );
        } else if ((parsedRanges as any[]).length > 1) {
          logger.error(
            "[rsbuild-dev-middleware] A 'Range' header with multiple ranges was provided. Multiple ranges are not supported, so a regular response will be sent for this request.",
          );
        }

        if (parsedRanges !== -2 && (parsedRanges as any[]).length === 1) {
          // eslint-disable-next-line no-param-reassign
          res.statusCode = 206;
          res.setHeader(
            'Content-Range',
            getValueContentRangeHeader(
              'bytes',
              size,
              (parsedRanges as Ranges)[0] as Range,
            ),
          );

          [offset, len] = getOffsetAndLenFromRange(
            (parsedRanges as Ranges)[0] as Range,
          );
        }
      }

      let bufferOrStream: undefined | Buffer | ReadStream;
      let byteLength: number;

      const [start, end] = calcStartAndEnd(offset, len);

      try {
        bufferOrStream = (
          context.outputFileSystem as unknown as {
            createReadStream: CreateReadStream;
          }
        ).createReadStream(filename, {
          start,
          end,
        });
        byteLength = end === 0 ? 0 : end - start + 1;
      } catch (_ignoreError) {
        await goNext();
        return;
      }

      // @ts-ignore
      res.setHeader('Content-Length', byteLength);

      if (req.method === 'HEAD') {
        if (res.statusCode === 404) {
          // eslint-disable-next-line no-param-reassign
          res.statusCode = 200;
        }
        res.end();
        return;
      }

      const isPipeSupports = typeof bufferOrStream.pipe === 'function';

      if (!isPipeSupports) {
        res.end(bufferOrStream);
        return;
      }

      const cleanup = () => {
        destroyStream(bufferOrStream, true);
      };

      bufferOrStream.on('error', (error: NodeJS.ErrnoException) => {
        cleanup();
        switch (error.code) {
          case 'ENAMETOOLONG':
          case 'ENOENT':
          case 'ENOTDIR':
            sendError(404);
            break;
          default:
            sendError(500);
            break;
        }
      });

      bufferOrStream.pipe(res);

      onFinishedStream(res, cleanup);
    }

    ready(context, processRequest, req);
  };
}
