import { rspackTest } from '@e2e/helper';

const DEPRECATION_LOG = /deprecated|deprecation/i;

rspackTest('should not print deprecation logs in dev', async ({ devOnly }) => {
  const rsbuild = await devOnly();
  await rsbuild.expectBuildEnd();
  rsbuild.expectNoLog(DEPRECATION_LOG);
});

rspackTest('should not print deprecation logs in build', async ({ build }) => {
  const rsbuild = await build();
  await rsbuild.expectBuildEnd();
  rsbuild.expectNoLog(DEPRECATION_LOG);
});
