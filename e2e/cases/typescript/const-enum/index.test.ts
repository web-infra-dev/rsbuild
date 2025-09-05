import { build, dev, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';

rspackOnlyTest(
  'should inline the enum values in production mode',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
    });

    await page.waitForFunction(() => window.testDog);
    expect(await page.evaluate(() => window.testFish)).toBe('fish,FISH');
    expect(await page.evaluate(() => window.testCat)).toBe('cat,CAT');
    expect(await page.evaluate(() => window.testDog)).toBe('dog,DOG');
    expect(await page.evaluate(() => window.testNumbers)).toBe('0,1,1.0');

    const indexJs = await rsbuild.getIndexBundle();
    expect(indexJs).toContain('window.testFish="fish,FISH"');
    expect(indexJs).toContain('window.testCat="cat,CAT"');
    expect(indexJs).toContain('window.testNumbers="0,1,1.0"');

    await rsbuild.close();
  },
);

test('should import the enum values as expected in development mode', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
  });

  await page.waitForFunction(() => window.testDog);
  expect(await page.evaluate(() => window.testFish)).toBe('fish,FISH');
  expect(await page.evaluate(() => window.testCat)).toBe('cat,CAT');
  expect(await page.evaluate(() => window.testDog)).toBe('dog,DOG');
  expect(await page.evaluate(() => window.testNumbers)).toBe('0,1,1.0');

  await rsbuild.close();
});
