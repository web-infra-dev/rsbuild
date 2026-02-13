import { test } from '@e2e/helper';

const EXPECTED_LOG = /built in [\d.]+ s/;

test('should print build time', async ({ runDevAndBuild }) => {
  await runDevAndBuild(
    async ({ result }) => {
      await result.expectLog(EXPECTED_LOG);
    },
    { serve: false },
  );
});
