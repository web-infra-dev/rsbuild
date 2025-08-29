import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should compile const enum correctly', async ({ page }) => {
  await build({
    cwd: __dirname,
    page,
  });
  expect(await page.evaluate(() => window.test1)).toBe('Fish fish, Cat cat');
  expect(await page.evaluate(() => window.test2)).toBe('Fish 0, Cat 1');

  // https://github.com/web-infra-dev/rsbuild/issues/5959
  expect(await page.evaluate(() => window.test3)).toBe('Fish FISH, Cat CAT');
  expect(await page.evaluate(() => window.test4)).toBe('Fish 0, Cat 1');
});
