import type { Compiler } from '@rspack/core';
import deepmerge from '../compiled/deepmerge/index.js';
import fse from '../compiled/fs-extra/index.js';
import color from '../compiled/picocolors/index.js';
import { DEFAULT_ASSET_PREFIX } from './constants';
import type {
  CacheGroups,
  ModifyChainUtils,
  NodeEnv,
  NormalizedConfig,
  RsbuildTarget,
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

export const isFunction = (func: unknown): func is (...args: any[]) => any =>
  typeof func === 'function';

export const isObject = (obj: unknown): obj is Record<string, any> =>
  obj !== null && typeof obj === 'object';

export const isPlainObject = (obj: unknown): obj is Record<string, any> =>
  isObject(obj) && Object.prototype.toString.call(obj) === '[object Object]';

export const isNil = (o: unknown): o is undefined | null =>
  o === undefined || o === null;

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

export const getPublicPathFromCompiler = (compiler: Compiler) => {
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
