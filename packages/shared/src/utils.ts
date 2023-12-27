import path from 'path';
import type { Compiler } from '@rspack/core';
import type {
  CacheGroup,
  CompilerTapFn,
  RsbuildTarget,
  ModifyChainUtils,
  NormalizedConfig,
  SharedCompiledPkgNames,
} from './types';
import fse from '../compiled/fs-extra';
import deepmerge from '../compiled/deepmerge';
import color from '../compiled/picocolors';
import { DEFAULT_ASSET_PREFIX } from './constants';

export { color, deepmerge };

export type Colors = Omit<
  keyof typeof color,
  'createColor' | 'isColorSupported'
>;

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

export const isNil = (o: unknown): o is undefined | null =>
  o === undefined || o === null;

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

export const getJsSourceMap = (config: NormalizedConfig) => {
  const { sourceMap } = config.output;
  if (sourceMap.js === undefined) {
    return isProd() ? false : 'cheap-module-source-map';
  }
  return sourceMap.js;
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

export function isServerTarget(target: RsbuildTarget[]) {
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

export const upperFirst = (str: string) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

/** The intersection of webpack and Rspack */
export const COMPILATION_PROCESS_STAGE = {
  PROCESS_ASSETS_STAGE_ADDITIONAL: -2000,
  PROCESS_ASSETS_STAGE_PRE_PROCESS: -1000,
  PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE: 700,
  PROCESS_ASSETS_STAGE_SUMMARIZE: 1000,
  PROCESS_ASSETS_STAGE_REPORT: 5000,
};

export const generateScriptTag = () => ({
  tagName: 'script',
  attributes: {
    type: 'text/javascript',
  },
  voidTag: false,
  meta: {},
});

export const getPublicPathFromCompiler = (compiler: Compiler) => {
  const { publicPath } = compiler.options.output;
  if (typeof publicPath === 'string' && publicPath !== 'auto') {
    return addTrailingSlash(publicPath);
  }
  // publicPath function is not supported yet
  return DEFAULT_ASSET_PREFIX;
};

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

export function pick<T, U extends keyof T>(obj: T, keys: ReadonlyArray<U>) {
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

export const prettyTime = (seconds: number) => {
  const format = (time: string) => color.bold(Number(time));

  if (seconds < 1) {
    const digits = seconds >= 0.01 ? 2 : 3;
    return `${format(seconds.toFixed(digits))} s`;
  }

  if (seconds < 60) {
    return `${format(seconds.toFixed(1))} s`;
  }

  const minutes = seconds / 60;
  return `${format(minutes.toFixed(2))} m`;
};

const colorList: Colors[] = ['green', 'cyan', 'yellow', 'blue', 'magenta'];

export const getProgressColor = (index: number) =>
  colorList[index % colorList.length];

export function onExitProcess(listener: NodeJS.ExitListener) {
  process.on('exit', listener);

  // listen to 'SIGINT' and trigger a exit
  // 'SIGINT' from the terminal is supported on all platforms, and can usually be generated with Ctrl + C
  process.on('SIGINT', () => {
    process.exit(0);
  });
}

export const isHtmlDisabled = (
  config: NormalizedConfig,
  target: RsbuildTarget,
) => {
  const { htmlPlugin } = config.tools as {
    htmlPlugin: boolean | Array<unknown>;
  };
  return (
    htmlPlugin === false ||
    (Array.isArray(htmlPlugin) && htmlPlugin.includes(false)) ||
    target !== 'web'
  );
};

export function isUsingHMR(
  config: NormalizedConfig,
  { isProd, target }: Pick<ModifyChainUtils, 'isProd' | 'target'>,
) {
  return (
    !isProd &&
    target !== 'node' &&
    target !== 'web-worker' &&
    target !== 'service-worker' &&
    config.dev.hmr
  );
}

export const isClientCompiler = (compiler: {
  options: {
    target?: Compiler['options']['target'];
  };
}) => {
  const { target } = compiler.options;

  if (target) {
    return Array.isArray(target) ? target.includes('web') : target === 'web';
  }

  return false;
};

type ServerCallbacks = {
  onInvalid: () => void;
  onDone: (stats: any) => void;
};

export const setupServerHooks = (
  compiler: {
    name?: Compiler['name'];
    hooks: {
      compile: CompilerTapFn<ServerCallbacks['onInvalid']>;
      invalid: CompilerTapFn<ServerCallbacks['onInvalid']>;
      done: CompilerTapFn<ServerCallbacks['onDone']>;
    };
  },
  hookCallbacks: ServerCallbacks,
) => {
  if (compiler.name === 'server') {
    return;
  }

  const { compile, invalid, done } = compiler.hooks;

  compile.tap('rsbuild-dev-server', hookCallbacks.onInvalid);
  invalid.tap('rsbuild-dev-server', hookCallbacks.onInvalid);
  done.tap('rsbuild-dev-server', hookCallbacks.onDone);
};
