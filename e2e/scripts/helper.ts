import { join } from 'path';
import { test } from '@playwright/test';
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
