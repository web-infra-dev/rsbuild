import { test } from '@e2e/helper';

const EXPECTED_LOG = /built failed in [\d.]+ s/;

test('should print build failed time in dev', async ({ devOnly }) => {
  const rsbuild = await devOnly();
  await rsbuild.expectLog(EXPECTED_LOG);
});

test('should print build failed time in build', async ({ build }) => {
  const rsbuild = await build({
    catchBuildError: true,
  });
  await rsbuild.expectLog(EXPECTED_LOG);
});
