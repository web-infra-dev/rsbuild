import type {
  ConfigChain,
  ConfigChainAsyncWithContext,
  ConfigChainMergeContext,
  ConfigChainWithContext,
} from '@rsbuild/shared';
import { isFunction, isNil, isPlainObject } from '@rsbuild/shared';

/**
 * Merge one or more configs into a final config,
 * and allow to modify the config object via a function.
 */
export function reduceConfigs<T>({
  initial,
  config,
  mergeFn = Object.assign,
}: {
  /**
   * Initial configuration object.
   */
  initial: T;
  /**
   * The configuration object, function, or array of configuration objects/functions
   * to be merged into the initial configuration
   */
  config?: ConfigChain<T> | undefined;
  /**
   * The function used to merge configuration objects.
   * @default Object.assign
   */
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
  /**
   * Initial configuration object.
   */
  initial: T;
  /**
   * The configuration object, function, or array of configuration objects/functions
   * to be merged into the initial configuration
   */
  config?: ConfigChainWithContext<T, Ctx> | undefined;
  /**
   * Context object that can be used within the configuration functions.
   */
  ctx?: Ctx;
  /**
   * The function used to merge configuration objects.
   * @default Object.assign
   */
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
