import { expect, test } from '@e2e/helper';

test('should allow to import TSX files with .jsx extension', async ({
  page,
  build,
}) => {
  await build();
  expect(await page.evaluate(() => window.test)).toBe(1);
});
