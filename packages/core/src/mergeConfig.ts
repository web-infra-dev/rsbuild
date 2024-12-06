import { castArray, cloneDeep, isFunction, isPlainObject } from './helpers';
import type { RsbuildConfig } from './types';

const OVERRIDE_PATHS = [
  'performance.removeConsole',
  'output.inlineScripts',
  'output.inlineStyles',
  'output.cssModules.auto',
  'output.overrideBrowserslist',
  'server.open',
  'server.printUrls',
  'resolve.extensions',
  'provider',
];

/**
 * When merging configs, some properties prefer `override` over `merge to array`
 */
const isOverridePath = (key: string) => {
  // ignore environments name prefix, such as `environments.web`
  if (key.startsWith('environments.')) {
    const realKey = key.split('.').slice(2).join('.');
    return OVERRIDE_PATHS.includes(realKey);
  }
  return OVERRIDE_PATHS.includes(key);
};

const merge = (x: unknown, y: unknown, path = '') => {
  // force some keys to override
  if (isOverridePath(path)) {
    return y ?? x;
  }

  // ignore undefined property
  if (x === undefined) {
    return isPlainObject(y) ? cloneDeep(y) : y;
  }
  if (y === undefined) {
    return isPlainObject(x) ? cloneDeep(x) : x;
  }

  // no need to merge boolean with object or function, such as `tools.htmlPlugin`
  if (typeof x === 'boolean' || typeof y === 'boolean') {
    return y;
  }

  const pair = [x, y];

  // combine array
  if (pair.some(Array.isArray)) {
    return [...castArray(x), ...castArray(y)];
  }

  // convert function to chained function
  if (pair.some(isFunction)) {
    return pair;
  }

  if (!isPlainObject(x) || !isPlainObject(y)) {
    return y;
  }

  const merged: Record<string, unknown> = {};
  const keys = new Set([...Object.keys(x), ...Object.keys(y)]);

  for (const key of keys) {
    const childPath = path ? `${path}.${key}` : key;
    merged[key] = merge(x[key], y[key], childPath);
  }

  return merged;
};

export const mergeRsbuildConfig = <T = RsbuildConfig>(...configs: T[]): T => {
  if (configs.length === 2) {
    return merge(configs[0], configs[1]) as T;
  }

  if (configs.length < 2) {
    return configs[0];
  }

  return configs.reduce(
    (result, config) => merge(result, config) as T,
    {} as T,
  );
};
