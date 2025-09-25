import { test } from '@e2e/helper';

test('should forward browser error logs to terminal', async ({ dev }) => {
  const rsbuild = await dev();
  await rsbuild.expectLog('error   [browser] Uncaught Error: test');
});
