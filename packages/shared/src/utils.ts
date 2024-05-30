import path from 'node:path';
import type { Compiler, MultiCompiler } from '@rspack/core';
import type {
  Compiler as WebpackCompiler,
  MultiCompiler as WebpackMultiCompiler,
} from 'webpack';
import deepmerge from '../compiled/deepmerge/index.js';
import fse from '../compiled/fs-extra/index.js';
import color from '../compiled/picocolors/index.js';
import { DEFAULT_ASSET_PREFIX } from './constants';
import type {
  CacheGroups,
  ModifyChainUtils,
  MultiStats,
  NodeEnv,
  NormalizedConfig,
  RsbuildTarget,
  Stats,
} from './types';

export { color, deepmerge };

export type Colors = Omit<
  keyof typeof color,
  'createColor' | 'isColorSupported'
>;

export const getNodeEnv = () => process.env.NODE_ENV as NodeEnv;

export const setNodeEnv = (env: NodeEnv) => {
  process.env.NODE_ENV = env;
};

export const isDev = (): boolean => getNodeEnv() === 'development';

export const isProd = (): boolean => getNodeEnv() === 'production';

export const isTest = () => getNodeEnv() === 'test';

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
export const removeTailingSlash = (s: string): string => s.replace(/\/+$/, '');
export const addTrailingSlash = (s: string): string =>
  s.endsWith('/') ? s : `${s}/`;

export interface AwaitableGetter<T> extends PromiseLike<T[]> {
  promises: Promise<T>[];
}

export const getJsSourceMap = (config: NormalizedConfig) => {
  const { sourceMap } = config.output;
  if (sourceMap.js === undefined) {
    return isProd() ? false : 'cheap-module-source-map';
  }
  return sourceMap.js;
};

export type SharedCompiledPkgNames = 'autoprefixer';

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

export const getCoreJsVersion = (corejsPkgPath: string) => {
  try {
    const { version } = fse.readJSONSync(corejsPkgPath);
    const [major, minor] = version.split('.');
    return `${major}.${minor}`;
  } catch (err) {
    return '3';
  }
};

export const castArray = <T>(arr?: T | T[]): T[] => {
  if (arr === undefined) {
    return [];
  }
  return Array.isArray(arr) ? arr : [arr];
};

export const camelCase = (input: string): string =>
  input.replace(/[-_](\w)/g, (_, c) => c.toUpperCase());

export const kebabCase = (str: string) =>
  str
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');

export const cloneDeep = <T>(value: T): T => {
  if (value === null || value === undefined) {
    return value;
  }
  return deepmerge({}, value);
};

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
): CacheGroups {
  const experienceCacheGroup: CacheGroups = {};

  for (const [name, pkgs] of Object.entries(group)) {
    const key = `lib-${name}`;

    experienceCacheGroup[key] = {
      test: createDependenciesRegExp(...pkgs),
      priority: 0,
      name: key,
      reuseExistingChunk: true,
    };
  }

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

  if (typeof publicPath === 'string') {
    // 'auto' is a magic value in Rspack and behave like `publicPath: ""`
    if (publicPath === 'auto') {
      return '';
    }
    return addTrailingSlash(publicPath);
  }

  // publicPath function is not supported yet, fallback to default value
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

const colorList: Colors[] = ['green', 'cyan', 'yellow', 'blue', 'magenta'];

export const getProgressColor = (index: number) =>
  colorList[index % colorList.length];

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
  return !isProd && config.dev.hmr && target === 'web';
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

export const isNodeCompiler = (compiler: {
  options: {
    target?: Compiler['options']['target'];
  };
}) => {
  const { target } = compiler.options;

  if (target) {
    return Array.isArray(target) ? target.includes('node') : target === 'node';
  }

  return false;
};

export const isMultiCompiler = <
  C extends Compiler | WebpackCompiler = Compiler,
  M extends MultiCompiler | WebpackMultiCompiler = MultiCompiler,
>(
  compiler: C | M,
): compiler is M => {
  return compiler.constructor.name === 'MultiCompiler';
};

export const applyToCompiler = (
  compiler: Compiler | MultiCompiler,
  apply: (c: Compiler) => void,
) => {
  if (isMultiCompiler(compiler)) {
    compiler.compilers.forEach(apply);
  } else {
    apply(compiler);
  }
};

export const onCompileDone = (
  compiler: Compiler | MultiCompiler,
  onDone: (stats: Stats | MultiStats) => Promise<void>,
  MultiStatsCtor: new (stats: Stats[]) => MultiStats,
) => {
  // The MultiCompiler of Rspack does not supports `done.tapPromise`,
  // so we need to use the `done` hook of `MultiCompiler.compilers` to implement it.
  if (isMultiCompiler(compiler)) {
    const { compilers } = compiler;
    const compilerStats: Stats[] = [];
    let doneCompilers = 0;

    for (let index = 0; index < compilers.length; index++) {
      const compiler = compilers[index];
      const compilerIndex = index;
      let compilerDone = false;

      compiler.hooks.done.tapPromise('rsbuild:done', async (stats) => {
        if (!compilerDone) {
          compilerDone = true;
          doneCompilers++;
        }

        compilerStats[compilerIndex] = stats;

        if (doneCompilers === compilers.length) {
          await onDone(new MultiStatsCtor(compilerStats));
        }
      });

      compiler.hooks.invalid.tap('rsbuild:done', () => {
        if (compilerDone) {
          compilerDone = false;
          doneCompilers--;
        }
      });
    }
  } else {
    compiler.hooks.done.tapPromise('rsbuild:done', onDone);
  }
};
