import { rspackTest, test } from '@e2e/helper';

const EXPECTED_LOG = /build failed in [\d.]+ s/;

rspackTest('should print build failed time in dev', async ({ devOnly }) => {
  const rsbuild = await devOnly();
  await rsbuild.expectLog(EXPECTED_LOG);
});

rspackTest('should print build failed time in build', async ({ build }) => {
  const rsbuild = await build({
    catchBuildError: true,
  });
  await rsbuild.expectLog(EXPECTED_LOG);
});
