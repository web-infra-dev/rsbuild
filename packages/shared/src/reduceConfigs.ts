import type { MaybePromise, OneOrMany } from './types';
import { isFunction, isNil, isPlainObject } from './utils';

export type ConfigChain<T> = OneOrMany<T | ((config: T) => T | void)>;

export type ConfigChainWithContext<T, Ctx> = OneOrMany<
  T | ((config: T, ctx: Ctx) => T | void)
>;

export type ConfigChainAsyncWithContext<T, Ctx> = OneOrMany<
  T | ((config: T, ctx: Ctx) => MaybePromise<T | void>)
>;

export type ConfigChainMergeContext<T, Ctx> = OneOrMany<
  T | ((merged: { value: T } & Ctx) => T | void)
>;

/**
 * Merge one or more configs into a final config,
 * and allow to modify the config object via a function.
 */
export function reduceConfigs<T>({
  initial,
  config,
  mergeFn = Object.assign,
}: {
  initial: T;
  config?: ConfigChain<T> | undefined;
  mergeFn?: typeof Object.assign;
}): T {
  if (isNil(config)) {
    return initial;
  }
  if (isPlainObject(config)) {
    return isPlainObject(initial) ? mergeFn(initial, config) : (config as T);
  }
  if (isFunction(config)) {
    return config(initial) ?? initial;
  }
  if (Array.isArray(config)) {
    return config.reduce(
      (initial, config) => reduceConfigs({ initial, config, mergeFn }),
      initial,
    );
  }
  return config ?? initial;
}

/**
 * Merge one or more configs into a final config,
 * and allow to modify the config object via a function, the function accepts a context object.
 */
export function reduceConfigsWithContext<T, Ctx>({
  initial,
  config,
  ctx,
  mergeFn = Object.assign,
}: {
  initial: T;
  config?: ConfigChainWithContext<T, Ctx> | undefined;
  ctx?: Ctx;
  mergeFn?: typeof Object.assign;
}): T {
  if (isNil(config)) {
    return initial;
  }
  if (isPlainObject(config)) {
    return isPlainObject(initial) ? mergeFn(initial, config) : (config as T);
  }
  if (isFunction(config)) {
    return config(initial, ctx) ?? initial;
  }
  if (Array.isArray(config)) {
    return config.reduce(
      (initial, config) =>
        reduceConfigsWithContext({ initial, config, ctx, mergeFn }),
      initial,
    );
  }
  return config ?? initial;
}

/**
 * Merge one or more configs into a final config,
 * and allow to modify the config object via an async function, the function accepts a context object.
 */
export async function reduceConfigsAsyncWithContext<T, Ctx>({
  initial,
  config,
  ctx,
  mergeFn = Object.assign,
}: {
  initial: T;
  config?: ConfigChainAsyncWithContext<T, Ctx> | undefined;
  ctx?: Ctx;
  mergeFn?: typeof Object.assign;
}): Promise<T> {
  if (isNil(config)) {
    return initial;
  }
  if (isPlainObject(config)) {
    return isPlainObject(initial) ? mergeFn(initial, config) : (config as T);
  }
  if (isFunction(config)) {
    return (await config(initial, ctx)) ?? initial;
  }
  if (Array.isArray(config)) {
    return config.reduce(
      (initial, config) =>
        reduceConfigsWithContext({ initial, config, ctx, mergeFn }),
      initial,
    );
  }
  return config ?? initial;
}

/**
 * Merge one or more configs into a final config,
 * and allow to modify the config object via an async function, the function accepts a merged object.
 */
export function reduceConfigsMergeContext<T, Ctx>({
  initial,
  config,
  ctx,
  mergeFn = Object.assign,
}: {
  initial: T;
  config?: ConfigChainMergeContext<T, Ctx> | undefined;
  ctx?: Ctx;
  mergeFn?: typeof Object.assign;
}): T {
  if (isNil(config)) {
    return initial;
  }
  if (isPlainObject(config)) {
    return isPlainObject(initial) ? mergeFn(initial, config) : (config as T);
  }
  if (isFunction(config)) {
    return config({ value: initial, ...ctx }) ?? initial;
  }
  if (Array.isArray(config)) {
    return config.reduce(
      (initial, config) =>
        reduceConfigsMergeContext({
          initial,
          config,
          ctx,
          mergeFn,
        }),
      initial,
    );
  }
  return config ?? initial;
}
