import { join } from 'path';
import { test } from '@playwright/test';
import { fs } from '@rsbuild/shared/fs-extra';
import glob, { Options as GlobOptions } from 'fast-glob';

export const providerType = process.env.PROVIDE_TYPE || 'webpack';

export const getProviderTest = (supportType: string[] = ['webpack']) => {
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
    ret[file] = await fs.readFile(file, 'utf-8');
  }

  return ret;
};

export { runStaticServer } from './static';
