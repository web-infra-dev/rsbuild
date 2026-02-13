import { test } from '@e2e/helper';

test('should support calling `close()` multiple times', async ({
  runDevAndBuild,
}) => {
  await runDevAndBuild(
    async ({ result }) => {
      await result.close();
      await result.close();
    },
    { serve: false },
  );
});
