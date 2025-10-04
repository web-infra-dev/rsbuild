import { rspackTest } from '@e2e/helper';

const EXPECTED_LOG = `Build failed. No errors reported since Rspack's "stats.errors" is disabled.`;

rspackTest(
  'should print a hint if stats.errors is disabled after a dev failure',
  async ({ dev }) => {
    const rsbuild = await dev();
    await rsbuild.expectLog(EXPECTED_LOG);
  },
);

rspackTest(
  'should print a hint if stats.errors is disabled after a build failure',
  async ({ build }) => {
    const rsbuild = await build({
      catchBuildError: true,
    });
    await rsbuild.expectLog(EXPECTED_LOG);
  },
);
