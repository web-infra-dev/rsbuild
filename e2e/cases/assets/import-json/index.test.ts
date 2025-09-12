import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest('should import JSON correctly', async ({ page, build }) => {
  await build();

  expect(await page.evaluate('window.age')).toBe(1);
  expect(await page.evaluate('window.b')).toBe('{"list":[1,2]}');
});
