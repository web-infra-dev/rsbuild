import { build, dev, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';

rspackOnlyTest(
  'should inline the constants in production mode',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
    });
    expect(await page.evaluate(() => window.test1)).toBe('Fish fish, Cat cat');
    expect(await page.evaluate(() => window.test2)).toBe('Fish FISH, Cat CAT');

    const indexJs = await rsbuild.getIndexBundle();
    expect(indexJs).toContain('window.test1="Fish fish, Cat cat"');
    expect(indexJs).toContain('window.test2="Fish FISH, Cat CAT"');

    await rsbuild.close();
  },
);

test('should import the constants as expected in development mode', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
  });
  expect(await page.evaluate(() => window.test1)).toBe('Fish fish, Cat cat');
  expect(await page.evaluate(() => window.test2)).toBe('Fish FISH, Cat CAT');
  await rsbuild.close();
});
