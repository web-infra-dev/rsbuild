import { build, dev, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';

rspackOnlyTest(
  'should inline the constants in production mode',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
    });
    await page.waitForFunction(() => window.test3);
    expect(await page.evaluate(() => window.test1)).toBe('fish,FISH');
    expect(await page.evaluate(() => window.test2)).toBe('cat,CAT');
    expect(await page.evaluate(() => window.test3)).toBe('dog,DOG');

    const indexJs = await rsbuild.getIndexBundle();
    expect(indexJs).toContain('window.test1="fish,FISH"');
    expect(indexJs).toContain('window.test2="cat,CAT"');

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
  await page.waitForFunction(() => window.test3);
  expect(await page.evaluate(() => window.test1)).toBe('fish,FISH');
  expect(await page.evaluate(() => window.test2)).toBe('cat,CAT');
  expect(await page.evaluate(() => window.test3)).toBe('dog,DOG');
  await rsbuild.close();
});
