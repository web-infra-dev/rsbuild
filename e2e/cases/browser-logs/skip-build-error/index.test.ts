import { MODULE_BUILD_FAILED_LOG, rspackTest } from '@e2e/helper';

rspackTest(
  'should skip browser error logs if build failed',
  async ({ dev }) => {
    const rsbuild = await dev();
    await rsbuild.expectLog(MODULE_BUILD_FAILED_LOG);
    rsbuild.expectNoLog('[browser]');
  },
);
