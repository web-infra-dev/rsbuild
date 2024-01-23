import { castArray, isFunction, isObject, cloneDeep } from './utils';
import type { RsbuildConfig } from './types/config';

/**
 * When merging configs, some properties prefer `override` over `merge to array`
 */
const isOverriddenConfigKey = (key: string) =>
  [
    'performance.removeConsole',
    'output.inlineScripts',
    'output.inlineStyles',
    'output.cssModules.auto',
    'output.targets',
    'server.printUrls',
    'dev.startUrl',
  ].includes(key);

function isMergeableObject(value: unknown): value is Record<string, unknown> {
  if (!isObject(value)) {
    return false;
  }
  const type = Object.prototype.toString.call(value);
  return type !== '[object RegExp]' && type !== '[object Date]';
}

const clone = (value: unknown) =>
  isMergeableObject(value) ? cloneDeep(value) : value;

const merge = (x: unknown, y: unknown, path = '') => {
  // force some keys to override
  if (isOverriddenConfigKey(path)) {
    return clone(y ?? x);
  }

  // ignore undefined property
  if (x === undefined) {
    return clone(y);
  }
  if (y === undefined) {
    return clone(x);
  }

  const pair = [x, y];

  // combine array
  if (pair.some(Array.isArray)) {
    return [...castArray(clone(x)), ...castArray(clone(y))];
  }

  // convert function to chained function
  if (pair.some(isFunction)) {
    return [clone(x), clone(y)];
  }

  if (!isMergeableObject(x) || !isMergeableObject(y)) {
    return y;
  }

  const merged: Record<string, any> = {};
  const keys = new Set([...Object.keys(x), ...Object.keys(y)]);

  keys.forEach((key) => {
    const childPath = path ? `${path}.${key}` : key;
    merged[key] = merge(x[key], y[key], childPath);
  });

  return merged;
};

export const mergeRsbuildConfig = (
  ...configs: RsbuildConfig[]
): RsbuildConfig => {
  if (configs.length < 2) {
    return configs[0];
  }

  if (configs.length === 2) {
    return merge(configs[0], configs[1]) as RsbuildConfig;
  }

  return configs.reduce(
    (result, config) => merge(result, config) as RsbuildConfig,
    {},
  );
};
