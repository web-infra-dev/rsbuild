import { isFunction, isPlainObject } from './utils';

export type Falsy = false | null | undefined | 0 | '';

export function mergeChainedOptions<T, U>(params: {
  defaults: T;
  options?:
    | T
    | ((config: T, utils?: U) => T | void)
    | Array<T | ((config: T, utils?: U) => T | void)>
    | Falsy;
  utils?: U;
  mergeFn?: typeof Object.assign;
}): T;
export function mergeChainedOptions<T, U>(params: {
  defaults: T;
  options:
    | T
    | ((config: T, utils: U) => T | void)
    | Array<T | ((config: T, utils: U) => T | void)>
    | Falsy;
  utils: U;
  mergeFn?: typeof Object.assign;
}): T;
export function mergeChainedOptions<T extends Record<string, unknown>>({
  defaults,
  options,
  utils,
  mergeFn = Object.assign,
}: {
  defaults: T;
  options?: unknown;
  utils?: unknown;
  mergeFn?: typeof Object.assign;
}) {
  if (!options) {
    return defaults;
  }

  if (isPlainObject(options) as any) {
    return mergeFn(defaults, options);
  }

  if (isFunction(options)) {
    const ret = options(defaults, utils);
    if (ret) {
      return ret;
    }
  } else if (Array.isArray(options)) {
    return options.reduce(
      (defaults, options) =>
        mergeChainedOptions({
          defaults,
          options,
          utils,
          mergeFn,
        }),
      defaults,
    );
  }

  return defaults;
}
