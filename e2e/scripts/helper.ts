import { join } from 'path';
import { test, expect } from '@playwright/test';
import { fse } from '@rsbuild/shared';
import glob, { Options as GlobOptions } from 'fast-glob';

export const providerType = process.env.PROVIDE_TYPE || 'rspack';

process.env.PROVIDE_TYPE = providerType;

export const getProviderTest = (supportType: string[] = ['rspack']) => {
  if (supportType.includes(providerType)) {
    return test;
  }

  const testSkip = test.skip;

  // @ts-expect-error
  testSkip.describe = test.describe.skip;
  return testSkip as typeof test.skip & {
    describe: typeof test.describe.skip;
  };
};

export const webpackOnlyTest = getProviderTest(['webpack']);
export const rspackOnlyTest = getProviderTest(['rspack']);

export const globContentJSON = async (path: string, options?: GlobOptions) => {
  const files = await glob(join(path, '**/*'), options);
  const ret: Record<string, string> = {};

  for await (const file of files) {
    ret[file] = await fse.readFile(file, 'utf-8');
  }

  return ret;
};

export const awaitFileExists = async (dir: string, checks = 0) => {
  const maxChecks = 100;
  const interval = 100;
  if (fse.existsSync(dir)) {
    expect(true).toBe(true);
  } else if (checks < maxChecks) {
    checks++;
    await new Promise((resolve) => setTimeout(resolve, interval));
    await awaitFileExists(dir, checks);
  } else {
    expect(false).toBe(true);
  }
};
