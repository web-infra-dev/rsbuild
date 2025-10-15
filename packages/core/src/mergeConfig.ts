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
  'resolve.conditionNames',
  'resolve.mainFields',
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
  return (
    OVERRIDE_PATHS.includes(key) ||
    // output.filename.* supports function but we should not merge them as array
    key.startsWith('output.filename.')
  );
};

const merge = (x: unknown, y: unknown, path = ''): unknown => {
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

/**
 * Preprocess config before merging to convert the raw config into a consistent
 * object-based structure. This ensures some properties can be merged as expected.
 */
const normalizeConfigStructure = <T = RsbuildConfig>(config: T): T => {
  let { dev, output, ...rest } = config as RsbuildConfig;

  if (output) {
    output = { ...output };

    if (Array.isArray(output?.copy)) {
      output.copy = { patterns: output.copy };
    }
    if (typeof output?.distPath === 'string') {
      output.distPath = { root: output.distPath };
    }
  }

  if (dev) {
    dev = { ...dev };

    if (dev.watchFiles && !Array.isArray(dev.watchFiles)) {
      dev.watchFiles = [dev.watchFiles];
    }
  }

  return { ...rest, dev, output } as T;
};

export const mergeRsbuildConfig = <T = RsbuildConfig>(
  ...originalConfigs: T[]
): T => {
  const configs = originalConfigs.map(normalizeConfigStructure);

  // In most cases there will be two configs so we perform this check first
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
