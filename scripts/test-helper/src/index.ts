import type { Rspack, RspackRule } from '@rsbuild/core';
import { isPathString, normalizeToPosixPath } from './path';
import {
  type PathMatcher,
  applyMatcherReplacement,
  createDefaultPathMatchers,
} from './pathSerializer';

export { normalizeToPosixPath } from './path';

export interface SnapshotSerializerOptions {
  cwd?: string;
  workspace?: string;
  replace?: PathMatcher[];
}

export function createSnapshotSerializer(options?: SnapshotSerializerOptions) {
  const {
    cwd = process.cwd(),
    workspace = process.cwd(),
    replace: customMatchers = [],
  } = options || {};

  const pathMatchers: PathMatcher[] = [
    { mark: 'root', match: cwd },
    { mark: 'workspace', match: workspace },
    ...customMatchers,
    ...createDefaultPathMatchers(),
  ];

  for (const matcher of pathMatchers) {
    if (typeof matcher.match === 'string') {
      matcher.match = normalizeToPosixPath(matcher.match);
    }
  }

  return {
    pathMatchers,
    // match path-format string
    test: (val: unknown) => typeof val === 'string' && isPathString(val),
    print: (val: unknown) => {
      const normalized = normalizeToPosixPath(val as string);
      const replaced = applyMatcherReplacement(
        pathMatchers,
        normalized,
      ).replace(/"/g, '\\"');
      return `"${replaced}"`;
    },
  };
}

export * from './rsbuild';

export function matchRules(
  config: Rspack.Configuration,
  testFile: string,
): RspackRule[] {
  if (!config.module?.rules) {
    return [];
  }
  return config.module.rules.filter((rule) => {
    if (
      rule &&
      typeof rule === 'object' &&
      rule.test &&
      rule.test instanceof RegExp &&
      rule.test.test(testFile)
    ) {
      return true;
    }
    return false;
  });
}

export { matchPlugin } from './rsbuild';
