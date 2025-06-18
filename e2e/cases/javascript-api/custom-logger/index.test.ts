import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should allow to customize logger', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  expect(
    rsbuild.logs.find((item) => item.includes('[READY] built in')),
  ).toBeTruthy();
  await rsbuild.close();
});
