import { posix } from 'node:path';
import deepmerge from 'deepmerge';
import color from 'picocolors';
import type RspackChain from 'rspack-chain';
import type {
  Compiler as WebpackCompiler,
  MultiCompiler as WebpackMultiCompiler,
} from 'webpack';
import { DEFAULT_ASSET_PREFIX } from '../constants';
import type {
  FilenameConfig,
  NormalizedConfig,
  NormalizedEnvironmentConfig,
  RsbuildTarget,
  Rspack,
} from '../types';

export * from './fs';
export * from './path';
export * from './stats';

export const rspackMinVersion = '1.0.0';

export const getNodeEnv = () => process.env.NODE_ENV as string;
export const setNodeEnv = (env: string): void => {
  process.env.NODE_ENV = env;
};

export const isNil = (o: unknown): o is undefined | null =>
  o === undefined || o === null;

export const isFunction = (func: unknown): func is (...args: any[]) => any =>
  typeof func === 'function';

export const isObject = (obj: unknown): obj is Record<string, any> =>
  Object.prototype.toString.call(obj) === '[object Object]';

export const isPlainObject = (o: unknown): o is Record<string, any> => {
  if (isObject(o) === false) return false;

  // If has modified constructor
  const ctor = (o as Record<string, any>).constructor;
  if (ctor === undefined) return true;

  // If has modified prototype
  const prot = ctor.prototype;
  if (isObject(prot) === false) return false;

  // If constructor does not have an Object-specific method

  // biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
  if (prot.hasOwnProperty('isPrototypeOf') === false) {
    return false;
  }

  // Most likely a plain Object
  return true;
};

export const castArray = <T>(arr?: T | T[]): T[] => {
  if (arr === undefined) {
    return [];
  }
  return Array.isArray(arr) ? arr : [arr];
};

export const cloneDeep = <T>(value: T): T => {
  if (value === null || value === undefined) {
    return value;
  }
  return deepmerge<T>({}, value, {
    isMergeableObject: isPlainObject,
  });
};

const compareSemver = (version1: string, version2: string) => {
  const parts1 = version1.split('.').map(Number);
  const parts2 = version2.split('.').map(Number);
  const len = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < len; i++) {
    const item1 = parts1[i] ?? 0;
    const item2 = parts2[i] ?? 0;
    if (item1 > item2) {
      return 1;
    }
    if (item1 < item2) {
      return -1;
    }
  }

  return 0;
};

export const isSatisfyRspackVersion = async (
  originalVersion: string,
): Promise<boolean> => {
  let version = originalVersion;

  // The nightly version of rspack is to append `-canary-abc` to the current version
  if (version.includes('-canary')) {
    version = version.split('-canary')[0];
  }

  if (version && /^[\d\.]+$/.test(version)) {
    return compareSemver(version, rspackMinVersion) >= 0;
  }

  // ignore other unstable versions
  return true;
};

export const removeLeadingSlash = (s: string): string => s.replace(/^\/+/, '');
export const removeTailingSlash = (s: string): string => s.replace(/\/+$/, '');
export const addTrailingSlash = (s: string): string =>
  s.endsWith('/') ? s : `${s}/`;

export const formatPublicPath = (
  publicPath: string,
  withSlash = true,
): string => {
  // 'auto' is a magic value in Rspack and we should not add trailing slash
  if (publicPath === 'auto') {
    return publicPath;
  }

  return withSlash
    ? addTrailingSlash(publicPath)
    : removeTailingSlash(publicPath);
};

export const getPublicPathFromChain = (
  chain: RspackChain,
  withSlash = true,
): string => {
  const publicPath = chain.output.get('publicPath');

  if (typeof publicPath === 'string') {
    return formatPublicPath(publicPath, withSlash);
  }

  return formatPublicPath(DEFAULT_ASSET_PREFIX, withSlash);
};

export const getPublicPathFromCompiler = (
  compiler: Rspack.Compiler | Rspack.Compilation,
): string => {
  const { publicPath } = compiler.options.output;

  if (typeof publicPath === 'string') {
    // 'auto' is a magic value in Rspack and behave like `publicPath: ""`
    if (publicPath === 'auto') {
      return '';
    }
    return publicPath.endsWith('/') ? publicPath : `${publicPath}/`;
  }

  // publicPath function is not supported yet, fallback to default value
  return DEFAULT_ASSET_PREFIX;
};

export const urlJoin = (base: string, path: string) => {
  const [urlProtocol, baseUrl] = base.split('://');
  return `${urlProtocol}://${posix.join(baseUrl, path)}`;
};

// Can be replaced with URL.canParse when we drop support for Node.js 16
export const canParse = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const ensureAssetPrefix = (
  url: string,
  assetPrefix: Rspack.PublicPath = DEFAULT_ASSET_PREFIX,
): string => {
  // The use of an absolute URL without a protocol is technically legal,
  // however it cannot be parsed as a URL instance, just return it.
  // e.g. str is //example.com/foo.js
  if (url.startsWith('//')) {
    return url;
  }

  // If str is an complete URL, just return it.
  // Only absolute url with hostname & protocol can be parsed into URL instance.
  // e.g. str is https://example.com/foo.js
  if (canParse(url)) {
    return url;
  }

  // 'auto' is a magic value in Rspack and behave like `publicPath: ""`
  if (assetPrefix === 'auto') {
    return url;
  }

  // function is not supported by this helper
  if (typeof assetPrefix === 'function') {
    return url;
  }

  if (assetPrefix.startsWith('http')) {
    return urlJoin(assetPrefix, url);
  }

  if (assetPrefix.startsWith('//')) {
    return urlJoin(`https:${assetPrefix}`, url).replace('https:', '');
  }

  return posix.join(assetPrefix, url);
};

export function getFilename(
  config: NormalizedConfig | NormalizedEnvironmentConfig,
  type: 'js',
  isProd: boolean,
  isServer?: boolean,
): NonNullable<FilenameConfig['js']>;
export function getFilename(
  config: NormalizedConfig | NormalizedEnvironmentConfig,
  type: 'css',
  isProd: boolean,
): NonNullable<FilenameConfig['css']>;
export function getFilename(
  config: NormalizedConfig | NormalizedEnvironmentConfig,
  type: Exclude<keyof FilenameConfig, 'js' | 'css'>,
  isProd: boolean,
  isServer?: boolean,
): string;
export function getFilename(
  config: NormalizedConfig | NormalizedEnvironmentConfig,
  type: keyof FilenameConfig,
  isProd: boolean,
  isServer?: boolean,
) {
  const { filename, filenameHash } = config.output;

  const getHash = () => {
    if (typeof filenameHash === 'string') {
      return filenameHash ? `.[${filenameHash}]` : '';
    }
    return filenameHash ? '.[contenthash:8]' : '';
  };

  const hash = getHash();

  switch (type) {
    case 'js':
      return filename.js ?? `[name]${isProd && !isServer ? hash : ''}.js`;
    case 'css':
      return filename.css ?? `[name]${isProd ? hash : ''}.css`;
    case 'svg':
      return filename.svg ?? `[name]${hash}.svg`;
    case 'font':
      return filename.font ?? `[name]${hash}[ext]`;
    case 'image':
      return filename.image ?? `[name]${hash}[ext]`;
    case 'media':
      return filename.media ?? `[name]${hash}[ext]`;
    case 'assets':
      return filename.assets ?? `[name]${hash}[ext]`;
    default:
      throw new Error(`unknown key ${type} in "output.filename"`);
  }
}

export function partition<T>(
  array: T[],
  predicate: (value: T) => boolean,
): [T[], T[]] {
  const truthy: T[] = [];
  const falsy: T[] = [];

  for (const value of array) {
    if (predicate(value)) {
      truthy.push(value);
    } else {
      falsy.push(value);
    }
  }

  return [truthy, falsy];
}

export const applyToCompiler = (
  compiler: Rspack.Compiler | Rspack.MultiCompiler,
  apply: (c: Rspack.Compiler, index: number) => void,
): void => {
  if (isMultiCompiler(compiler)) {
    compiler.compilers.forEach(apply);
  } else {
    apply(compiler, 0);
  }
};

export const upperFirst = (str: string): string =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

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

// Determine if the string is a URL
export const isURL = (str: string): boolean =>
  str.startsWith('http') || str.startsWith('//:');

export const createVirtualModule = (content: string) =>
  `data:text/javascript,${content}`;

export function isWebTarget(target: RsbuildTarget | RsbuildTarget[]): boolean {
  const targets = castArray(target);
  return targets.includes('web') || target.includes('web-worker');
}

export const isMultiCompiler = <
  C extends Rspack.Compiler | WebpackCompiler = Rspack.Compiler,
  M extends Rspack.MultiCompiler | WebpackMultiCompiler = Rspack.MultiCompiler,
>(
  compiler: C | M,
): compiler is M => {
  return compiler.constructor.name === 'MultiCompiler';
};

export function pick<T, U extends keyof T>(
  obj: T,
  keys: ReadonlyArray<U>,
): Pick<T, U> {
  return keys.reduce(
    (ret, key) => {
      if (obj[key] !== undefined) {
        ret[key] = obj[key];
      }
      return ret;
    },
    {} as Pick<T, U>,
  );
}

export const camelCase = (input: string): string =>
  input.replace(/[-_](\w)/g, (_, c) => c.toUpperCase());

export const prettyTime = (seconds: number): string => {
  const format = (time: string) => color.bold(time);

  if (seconds < 10) {
    const digits = seconds >= 0.01 ? 2 : 3;
    return `${format(seconds.toFixed(digits))} s`;
  }

  if (seconds < 60) {
    return `${format(seconds.toFixed(1))} s`;
  }

  const minutes = seconds / 60;
  return `${format(minutes.toFixed(2))} m`;
};
