import { expect, test } from '@e2e/helper';

const utf8Str = `你好 world! I'm 🦀`;

test('should resolve emoji filename in dev', async ({ page, dev }) => {
  await dev();
  expect(await page.evaluate('window.test')).toBe(utf8Str);
});

test('should resolve emoji filename in build', async ({ page, build }) => {
  const rsbuild = await build();
  const content = await rsbuild.getIndexBundle();
  expect(await page.evaluate('window.test')).toBe(utf8Str);
  expect(content.includes(utf8Str)).toBeTruthy();
});
