import type { OneOrMany } from './types';
import { isFunction, isNil, isPlainObject } from './utils';

export type ConfigChain<T> = OneOrMany<T | ((config: T) => T | void)>;

export type ConfigChainWithContext<T, Ctx> = OneOrMany<
  T | ((config: T, ctx: Ctx) => T | void)
>;

export type ConfigChainMergeContext<T, Ctx> = OneOrMany<
  T | ((merged: { value: T } & Ctx) => T | void)
>;

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
