import { expect, test } from '@e2e/helper';

const expected = '你好';

test('should resolve Chinese filename in dev', async ({ page, dev }) => {
  await dev();
  expect(await page.evaluate('window.test')).toBe(expected);
});

test('should resolve Chinese filename in build', async ({
  page,
  buildPreview,
}) => {
  await buildPreview();
  expect(await page.evaluate('window.test')).toBe(expected);
});
