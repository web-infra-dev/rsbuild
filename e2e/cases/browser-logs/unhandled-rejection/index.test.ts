import { test } from '@e2e/helper';

const EXPECTED_LOG = 'error   [browser] Unhandled Rejection: test';

test('should forward browser unhandled rejection logs to terminal', async ({
  dev,
}) => {
  const rsbuild = await dev();
  await rsbuild.expectLog(EXPECTED_LOG);
});
