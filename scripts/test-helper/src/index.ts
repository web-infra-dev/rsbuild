import type { Rspack, RspackRule } from '@rsbuild/core';

export { normalizeToPosixPath } from './path';

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
