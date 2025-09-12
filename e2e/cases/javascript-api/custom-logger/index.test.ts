import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest('should allow to customize logger', async ({ buildOnly }) => {
  const rsbuild = await buildOnly();
  expect(
    rsbuild.logs.find((item) => item.includes('[READY] built in')),
  ).toBeTruthy();
});
