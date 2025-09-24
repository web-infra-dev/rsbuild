import type { Callback, FilledContext } from '../index';

export function ready(
  context: FilledContext,
  callback: (...args: any[]) => any,
): void {
  if (context.state) {
    (callback as Callback)(context.stats);
    return;
  }
  context.callbacks.push(callback as Callback);
}
