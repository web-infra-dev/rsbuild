import os from 'node:os';
import _ from 'lodash';
import {
  compilePathMatcherRegExp,
  getRealTemporaryDirectory,
  splitPathString,
} from './path';

/** Different from  */
export type PathMatchExpression = string | RegExp;

export interface PathMatcher {
  match: PathMatchExpression;
  mark: string | ((substring: string, ...args: any[]) => string);
}

export interface ApplyPathMatcherOptions {
  minPartials?: number;
}

export function applyPathMatcher(
  matcher: PathMatcher,
  str: string,
  options: ApplyPathMatcherOptions = {},
) {
  const regex = compilePathMatcherRegExp(matcher.match);
  const replacer = (substring: string, ...args: any[]): string => {
    if (
      options.minPartials &&
      splitPathString(substring).length < options.minPartials
    ) {
      return substring;
    }
    const ret =
      typeof matcher.mark === 'string'
        ? matcher.mark
        : matcher.mark(substring, ...args);
    return `<${_.snakeCase(ret).toUpperCase()}>`;
  };
  return str.replace(regex, replacer);
}

export function applyMatcherReplacement(
  matchers: PathMatcher[],
  str: string,
  options: ApplyPathMatcherOptions = {},
) {
  return matchers.reduce((ret, matcher) => {
    return applyPathMatcher(matcher, ret, options);
  }, str);
}

export const createDefaultPathMatchers = () => {
  const ret: PathMatcher[] = [
    {
      match: /(?<=\/)(\.pnpm\/.+?\/node_modules)(?=\/)/,
      mark: 'pnpmInner',
    },
  ];
  const tmpdir = getRealTemporaryDirectory();
  tmpdir && ret.push({ match: tmpdir, mark: 'temp' });
  ret.push({ match: os.tmpdir(), mark: 'temp' });
  ret.push({ match: os.homedir(), mark: 'home' });
  return ret;
};
