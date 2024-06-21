import fs from 'node:fs';
import type { Compiler } from '@rspack/core';
import deepmerge from '../compiled/deepmerge/index.js';
import color from '../compiled/picocolors/index.js';
import { DEFAULT_ASSET_PREFIX } from './constants';
import type { CacheGroups } from './types';

export { color, deepmerge };

export type Colors = Omit<
  keyof typeof color,
  'createColor' | 'isColorSupported'
>;

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
    const rawJson = fs.readFileSync(corejsPkgPath, 'utf-8');
    const { version } = JSON.parse(rawJson);
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
