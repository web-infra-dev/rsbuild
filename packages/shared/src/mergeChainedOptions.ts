import {
  ChainedConfig,
  ChainedConfigWithUtils,
  ChainedConfigCombineUtils,
} from './types';
import { isFunction, isPlainObject } from './utils';

export type Falsy = false | null | undefined;

export function mergeChainedOptions<T, U>(params: {
  defaults: T;
  options?: ChainedConfig<T> | Falsy;
  mergeFn?: typeof Object.assign;
}): T;
export function mergeChainedOptions<T, U>(params: {
  defaults: T;
  options: ChainedConfigWithUtils<T, U> | Falsy;
  utils: U;
  mergeFn?: typeof Object.assign;
}): T;
export function mergeChainedOptions<T, U>(params: {
  defaults: T;
  options: ChainedConfigCombineUtils<T, U> | Falsy;
  utils: U;
  mergeFn?: typeof Object.assign;
  useObjectParam?: true;
}): T;
export function mergeChainedOptions<T extends Record<string, unknown>>({
  defaults,
  options,
  utils,
  mergeFn = Object.assign,
  useObjectParam,
}: {
  defaults: T;
  options?: unknown;
  utils?: unknown;
  mergeFn?: typeof Object.assign;
  useObjectParam?: true;
}) {
  if (!options) {
    return defaults;
  }

  if (isPlainObject(options)) {
    return mergeFn(defaults, options);
  }

  if (isFunction(options)) {
    const ret = useObjectParam
      ? options({
          value: defaults,
          ...(utils as Record<string, unknown>),
        })
      : options(defaults, utils);

    return ret || defaults;
  } else if (Array.isArray(options)) {
    return options.reduce(
      (defaults, options) =>
        mergeChainedOptions({
          defaults,
          options,
          utils,
          mergeFn,
          useObjectParam,
        }),
      defaults,
    );
  }

  return options ?? defaults;
}
