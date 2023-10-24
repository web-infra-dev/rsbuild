import { logger } from 'rslog';
import { isFunction, isPlainObject } from './utils';

export type Falsy = false | null | undefined | 0 | '';

export function mergeChainedOptions<T, U>(
  defaults: T,
  options?:
    | T
    | ((config: T, utils?: U) => T | void)
    | Array<T | ((config: T, utils?: U) => T | void)>
    | Falsy,
  utils?: U,
  mergeFn?: typeof Object.assign,
): T;
export function mergeChainedOptions<T, U>(
  defaults: T,
  options:
    | T
    | ((config: T, utils: U) => T | void)
    | Array<T | ((config: T, utils: U) => T | void)>
    | Falsy,
  utils: U,
  mergeFn?: typeof Object.assign,
): T;
export function mergeChainedOptions<T extends Record<string, unknown>>(
  defaults: T,
  options?: unknown,
  utils?: unknown,
  mergeFn = Object.assign,
) {
  if (!options) {
    return defaults;
  }

  if (isPlainObject(options) as any) {
    return mergeFn(defaults, options);
  }

  if (isFunction(options)) {
    const ret = options(defaults, utils);
    if (ret) {
      if (!isPlainObject(ret)) {
        logger.warn(
          `${options.name}: Function should mutate the config and return nothing, or return a cloned or merged version of config object.`,
        );
      }
      return ret;
    }
  } else if (Array.isArray(options)) {
    return options.reduce(
      (memo, cur) => mergeChainedOptions(memo, cur, utils, mergeFn),
      defaults,
    );
  } else {
    throw new Error(
      `mergeChainedOptions error:\ndefault options is: ${JSON.stringify(
        defaults,
      )}`,
    );
  }

  return defaults;
}
