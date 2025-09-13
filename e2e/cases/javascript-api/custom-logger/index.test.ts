import { expect, rspackTest } from '@e2e/helper';

rspackTest('should allow to customize logger', async ({ build }) => {
  const rsbuild = await build();
  expect(
    rsbuild.logs.find((item) => item.includes('[READY] built in')),
  ).toBeTruthy();
});
