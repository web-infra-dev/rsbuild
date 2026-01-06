import { test } from '@e2e/helper';

const DEPRECATION_LOG = /deprecated|deprecation/i;

test('should not print deprecation logs in dev', async ({ devOnly }) => {
  const rsbuild = await devOnly();
  await rsbuild.expectBuildEnd();
  rsbuild.expectNoLog(DEPRECATION_LOG);
});

test('should not print deprecation logs in build', async ({ build }) => {
  const rsbuild = await build();
  await rsbuild.expectBuildEnd();
  rsbuild.expectNoLog(DEPRECATION_LOG);
});
