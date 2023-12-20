import {
  ChainedConfig,
  ChainedConfigWithUtils,
  ChainedConfigCombineUtils,
} from './types';
import { isFunction, isPlainObject } from './utils';

export type Falsy = false | null | undefined;

export function mergeChainedOptions<T, U = unknown, F = Falsy>(params: {
  defaults: T;
  options?: ChainedConfig<T> | F;
  mergeFn?: typeof Object.assign;
  isFalsy?: (v: T | ChainedConfig<T> | F) => v is F;
}): T;
export function mergeChainedOptions<T, U, F = Falsy>(params: {
  defaults: T;
  options: ChainedConfigWithUtils<T, U> | F;
  utils: U;
  mergeFn?: typeof Object.assign;
  isFalsy?: (v: T | ChainedConfigWithUtils<T, U> | F) => v is F;
}): T;
export function mergeChainedOptions<T, U, F = Falsy>(params: {
  defaults: T;
  options: ChainedConfigCombineUtils<T, U> | F;
  utils: U;
  mergeFn?: typeof Object.assign;
  useObjectParam?: true;
  isFalsy?: (v: T | ChainedConfigCombineUtils<T, U> | F) => v is F;
}): T;
export function mergeChainedOptions<T, U = unknown, F = Falsy>({
  defaults,
  options,
  utils,
  mergeFn = Object.assign,
  useObjectParam,
  isFalsy = (v: unknown | F | undefined): v is F => !v,
}: {
  defaults: T;
  options?: unknown | F;
  utils?: U;
  mergeFn?: typeof Object.assign;
  useObjectParam?: true;
  /**
   * To determine if current value is falsy. `false | undefined | null` as falsy by default.
   */
  isFalsy?: (v: unknown | F | undefined) => v is F;
}) {
  if (isFalsy(options)) {
    return defaults;
  }

  if (isPlainObject(options)) {
    return mergeFn(
      defaults /* we assume that when options is an object, defaults should be an object */ as any,
      options,
    );
  }

  if (isFunction(options)) {
    const ret = useObjectParam
      ? options({
          value: defaults,
          ...(utils as Record<string, unknown>),
        })
      : options(defaults, utils);

    return isFalsy(ret) ? defaults : ret;
  } else if (Array.isArray(options)) {
    return options.reduce(
      (defaults, options) =>
        mergeChainedOptions({
          defaults,
          options,
          utils,
          mergeFn,
          useObjectParam,
          isFalsy,
        }),
      defaults,
    );
  }

  return options ?? defaults;
}
