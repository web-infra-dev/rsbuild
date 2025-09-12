import { test } from '@e2e/helper';

test('should support calling `close()` multiple times in dev', async ({
  dev,
}) => {
  const result = await dev();
  await result.close();
  await result.close();
});

test('should support calling `close()` multiple times in preview', async ({
  build,
  buildOnly,
}) => {
  const result = await buildOnly();
  await result.close();
  await result.close();
});
