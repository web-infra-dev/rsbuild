import { test } from '@e2e/helper';

const EXPECTED_LOG = 'error   [browser] Uncaught Error: test';

test('should forward browser error logs to terminal by default', async ({
  dev,
}) => {
  const rsbuild = await dev();
  await rsbuild.expectLog(EXPECTED_LOG);
});

test('should disable forwarding browser error logs', async ({ dev, page }) => {
  const rsbuild = await dev({
    config: {
      dev: {
        browserLogs: false,
      },
    },
  });
  rsbuild.expectNoLog(EXPECTED_LOG);
});
