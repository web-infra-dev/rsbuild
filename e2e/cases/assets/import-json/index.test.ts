import { expect, rspackTest } from '@e2e/helper';

rspackTest('should import JSON correctly', async ({ page, buildPreview }) => {
  await buildPreview();

  expect(await page.evaluate('window.age')).toBe(1);
  expect(await page.evaluate('window.b')).toBe('{"list":[1,2]}');
});
