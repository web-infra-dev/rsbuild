import type {
  CacheGroup,
  NormalizedConfig,
  RsbuildTarget,
  SharedCompiledPkgNames,
} from './types';
import path from 'path';
import fse from '../compiled/fs-extra';
import deepmerge from '../compiled/deepmerge';

export { deepmerge };

export const isDev = (): boolean => process.env.NODE_ENV === 'development';
export const isProd = (): boolean => process.env.NODE_ENV === 'production';
export const isTest = () => process.env.NODE_ENV === 'test';
export const isString = (str: unknown): str is string =>
  typeof str === 'string';
export const isUndefined = (obj: unknown): obj is undefined =>
  typeof obj === 'undefined';
export const isFunction = (func: unknown): func is (...args: any[]) => any =>
  typeof func === 'function';
export const isObject = (obj: unknown): obj is Record<string, any> =>
  obj !== null && typeof obj === 'object';
export const isPlainObject = (obj: unknown): obj is Record<string, any> =>
  isObject(obj) && Object.prototype.toString.call(obj) === '[object Object]';
export const isRegExp = (obj: any): obj is RegExp =>
  Object.prototype.toString.call(obj) === '[object RegExp]';

export const createVirtualModule = (content: string) =>
  `data:text/javascript,${content}`;

export const removeLeadingSlash = (s: string): string => s.replace(/^\/+/, '');
export const removeTailSlash = (s: string): string => s.replace(/\/+$/, '');

export const addTrailingSlash = (s: string): string =>
  s.endsWith('/') ? s : `${s}/`;

export interface AwaitableGetter<T> extends PromiseLike<T[]> {
  promises: Promise<T>[];
}

/**
 * Make Awaitable.
 */
export const awaitableGetter = <T>(
  promises: Promise<T>[],
): AwaitableGetter<T> => {
  const then: PromiseLike<T[]>['then'] = (...args) =>
    Promise.all(promises).then(...args);
  // eslint-disable-next-line no-thenable
  return { then, promises };
};

export const isUseJsSourceMap = (config: NormalizedConfig) => {
  const { disableSourceMap } = config.output || {};

  if (typeof disableSourceMap === 'boolean') {
    return !disableSourceMap;
  }

  return !disableSourceMap.js;
};

export const isUseCssSourceMap = (config: NormalizedConfig) => {
  const { disableSourceMap } = config.output || {};

  if (typeof disableSourceMap === 'boolean') {
    return !disableSourceMap;
  }

  // If the disableSourceMap.css option is not specified, we will enable it in development mode.
  // We do not need CSS Source Map in production mode.
  if (disableSourceMap.css === undefined) {
    return process.env.NODE_ENV !== 'production';
  }

  return !disableSourceMap.css;
};

export const getSharedPkgCompiledPath = (packageName: SharedCompiledPkgNames) =>
  path.join(__dirname, '../compiled', packageName);

// Determine if the string is a URL
export const isURL = (str: string) =>
  str.startsWith('http') || str.startsWith('//:');

export function isWebTarget(target: RsbuildTarget | RsbuildTarget[]) {
  return ['web', 'web-worker'].some((t) =>
    (Array.isArray(target) ? target : [target]).includes(t as RsbuildTarget),
  );
}

export function isServerTarget(target: RsbuildTarget | RsbuildTarget[]) {
  return (Array.isArray(target) ? target : [target]).some((item) =>
    ['node', 'service-worker'].includes(item),
  );
}

export function resolvePackage(loader: string, dirname: string) {
  // Vitest do not support require.resolve to source file
  return process.env.VITEST
    ? loader
    : require.resolve(loader, { paths: [dirname] });
}

export const getCoreJsVersion = (corejsPkgPath: string) => {
  try {
    const { version } = fse.readJSONSync(corejsPkgPath);
    const [major, minor] = version.split('.');
    return `${major}.${minor}`;
  } catch (err) {
    return '3';
  }
};

/**
 * ensure absolute file path.
 * @param base - Base path to resolve relative from.
 * @param filePath - Absolute or relative file path.
 * @returns Resolved absolute file path.
 */
export const ensureAbsolutePath = (base: string, filePath: string): string =>
  path.isAbsolute(filePath) ? filePath : path.resolve(base, filePath);

export const castArray = <T>(arr?: T | T[]): T[] => {
  if (arr === undefined) {
    return [];
  }
  return Array.isArray(arr) ? arr : [arr];
};

/**
 * Try to resolve npm package, return true if package is installed.
 */
export const isPackageInstalled = (
  name: string,
  resolvePaths: string | string[],
) => {
  try {
    require.resolve(name, { paths: castArray(resolvePaths) });
    return true;
  } catch (err) {
    return false;
  }
};

export const camelCase = (input: string): string =>
  input.replace(/[-_](\w)/g, (_, c) => c.toUpperCase());

export const cloneDeep = <T>(value: T): T => deepmerge({}, value);

const DEP_MATCH_TEMPLATE = /[\\/]node_modules[\\/](<SOURCES>)[\\/]/.source;

/** Expect to match path just like "./node_modules/react-router/" */
export const createDependenciesRegExp = (
  ...dependencies: (string | RegExp)[]
) => {
  const sources = dependencies.map((d) =>
    typeof d === 'string' ? d : d.source,
  );
  const expr = DEP_MATCH_TEMPLATE.replace('<SOURCES>', sources.join('|'));
  return new RegExp(expr);
};

export function createCacheGroups(
  group: Record<string, (string | RegExp)[]>,
): CacheGroup {
  const experienceCacheGroup: CacheGroup = {};

  Object.entries(group).forEach(([name, pkgs]) => {
    const key = `lib-${name}`;

    experienceCacheGroup[key] = {
      test: createDependenciesRegExp(...pkgs),
      priority: 0,
      name: key,
      reuseExistingChunk: true,
    };
  });

  return experienceCacheGroup;
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}
