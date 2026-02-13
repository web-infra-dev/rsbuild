import { test } from '@e2e/helper';

const EXPECTED_LOG = /build failed in [\d.]+ s/;

test('should print build failed time', async ({ runDevAndBuild }) => {
  await runDevAndBuild(
    async ({ result }) => {
      await result.expectLog(EXPECTED_LOG);
    },
    {
      serve: false,
      options: { catchBuildError: true },
    },
  );
});
