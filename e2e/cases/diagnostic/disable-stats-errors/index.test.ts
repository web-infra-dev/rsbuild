import { test } from '@e2e/helper';

const EXPECTED_LOG = `Build failed. No errors reported since Rspack's "stats.errors" is disabled.`;

test('should print hint if stats.errors is disabled after dev failed', async ({
  dev,
}) => {
  const rsbuild = await dev();
  await rsbuild.expectLog(EXPECTED_LOG);
});

test('should print hint if stats.errors is disabled after build failed', async ({
  build,
}) => {
  const rsbuild = await build({
    catchBuildError: true,
  });
  await rsbuild.expectLog(EXPECTED_LOG);
});
