import { expect, test } from '@e2e/helper';

test('should allow to customize logger', async ({ build }) => {
  const rsbuild = await build();
  expect(
    rsbuild.logs.find((item) => item.includes('[READY] built in')),
  ).toBeTruthy();
});
