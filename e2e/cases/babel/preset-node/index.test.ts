import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should run babel with @rsbuild/babel-preset/node correctly',
  async () => {
    await build({
      cwd: __dirname,
      runServer: true,
    });

    const { foo } = await import('./dist/server/index.js');
    expect(foo).toEqual(1);
  },
);
