import { rspackTest } from '@e2e/helper';

rspackTest(
  'should skip browser error logs if build failed',
  async ({ dev }) => {
    const rsbuild = await dev();
    await rsbuild.expectLog('Module build failed');
    rsbuild.expectNoLog('[browser]');
  },
);
