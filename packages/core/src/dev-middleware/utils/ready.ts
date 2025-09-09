import type { IncomingMessage } from 'node:http';
import { logger } from '../../logger';
import type { Callback, FilledContext } from '../index';

export function ready<Request extends IncomingMessage>(
  context: FilledContext,
  callback: (...args: any[]) => any,
  req?: Request,
): void {
  if (context.state) {
    (callback as Callback)(context.stats);
    return;
  }

  const name = req?.url || callback.name;

  logger.debug(
    `[rsbuild-dev-middleware] wait until bundle finished${name ? `: ${name}` : ''}`,
  );

  context.callbacks.push(callback as Callback);
}
