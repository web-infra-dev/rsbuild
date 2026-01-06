import { expect, test } from '@e2e/helper';

test('should allow to use the `using` declaration for explicit resource management in development', async ({
  page,
  dev,
}) => {
  await dev();

  expect(await page.evaluate('window.disposeCounter')).toEqual(4);
});

test('should allow to use the `using` declaration for explicit resource management in production', async ({
  page,
  buildPreview,
}) => {
  await buildPreview();

  expect(await page.evaluate('window.disposeCounter')).toEqual(4);
});
