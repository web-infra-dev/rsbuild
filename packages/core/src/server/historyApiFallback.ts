/**
 * This module is modified based on source found in
 * https://github.com/bripkens/connect-history-api-fallback
 *
 * MIT Licensed
 * Copyright (c) 2022 Ben Blackmore and contributors
 * https://github.com/bripkens/connect-history-api-fallback/blob/master/LICENSE
 */
import type { IncomingMessage } from 'node:http';
import { URL } from 'node:url';
import { logger } from '../logger';
import type {
  HistoryApiFallbackOptions,
  HistoryApiFallbackTo,
  RequestHandler,
} from '../types';

export function historyApiFallbackMiddleware(
  options: HistoryApiFallbackOptions = {},
): RequestHandler {
  return (req, _res, next) => {
    const { headers } = req;

    if (!req.url) {
      return next();
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      logger.debug(
        'Not rewriting',
        req.method,
        req.url,
        'because the method is not GET or HEAD.',
      );
      return next();
    }

    if (!headers || typeof headers.accept !== 'string') {
      logger.debug(
        'Not rewriting',
        req.method,
        req.url,
        'because the client did not send an HTTP accept header.',
      );
      return next();
    }

    if (headers.accept.indexOf('application/json') === 0) {
      logger.debug(
        'Not rewriting',
        req.method,
        req.url,
        'because the client prefers JSON.',
      );
      return next();
    }

    const rewrites = options.rewrites || [];
    const htmlAcceptHeaders = options.htmlAcceptHeaders || ['text/html', '*/*'];
    const { accept } = headers;

    if (!htmlAcceptHeaders.some((item) => accept.includes(item))) {
      logger.debug(
        'Not rewriting',
        req.method,
        req.url,
        'because the client does not accept HTML.',
      );
      return next();
    }

    let parsedUrl: URL;
    try {
      const host = req.headers.host || 'localhost';
      parsedUrl = new URL(req.url, `http://${host}`);
    } catch {
      // skip invalid request
      return next();
    }

    let rewriteTarget: string;

    for (const rewrite of rewrites) {
      const match = parsedUrl.pathname?.match(rewrite.from);
      if (match) {
        rewriteTarget = evaluateRewriteRule(parsedUrl, match, rewrite.to, req);

        if (rewriteTarget.charAt(0) !== '/') {
          logger.debug(
            'We recommend using an absolute path for the rewrite target.',
            'Received a non-absolute rewrite target',
            rewriteTarget,
            'for URL',
            req.url,
          );
        }

        logger.debug('Rewriting', req.method, req.url, 'to', rewriteTarget);
        req.url = rewriteTarget;
        return next();
      }
    }

    const { pathname } = parsedUrl;
    if (
      pathname &&
      pathname.lastIndexOf('.') > pathname.lastIndexOf('/') &&
      options.disableDotRule !== true
    ) {
      logger.debug(
        'Not rewriting',
        req.method,
        req.url,
        'because the path includes a dot (.) character.',
      );
      return next();
    }

    const index = options.index || '/index.html';
    logger.debug('Rewriting', req.method, req.url, 'to', index);
    req.url = index;
    next();
  };
}

function evaluateRewriteRule(
  parsedUrl: URL,
  match: RegExpMatchArray,
  rule: HistoryApiFallbackTo,
  req: IncomingMessage,
) {
  if (typeof rule === 'string') {
    return rule;
  }
  if (typeof rule !== 'function') {
    throw new Error('Rewrite rule can only be of type string or function.');
  }
  return rule({
    parsedUrl: parsedUrl,
    match: match,
    request: req,
  });
}
