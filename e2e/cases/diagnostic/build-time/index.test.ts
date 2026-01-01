import { rspackTest } from '@e2e/helper';

const EXPECTED_LOG = /built in [\d.]+ s/;

rspackTest('should print build time in dev', async ({ devOnly }) => {
  const rsbuild = await devOnly();
  await rsbuild.expectLog(EXPECTED_LOG);
});

rspackTest('should print build time in build', async ({ build }) => {
  const rsbuild = await build();
  await rsbuild.expectLog(EXPECTED_LOG);
});
