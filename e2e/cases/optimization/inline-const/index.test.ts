import { build, dev, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';

rspackOnlyTest('should inline the constants in build', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
  });
  await page.waitForFunction(() => window.testDog);
  expect(await page.evaluate(() => window.testFish)).toBe('fish,FISH');
  expect(await page.evaluate(() => window.testCat)).toBe('cat,CAT');
  expect(await page.evaluate(() => window.testDog)).toBe('dog,DOG');

  const indexJs = await rsbuild.getIndexBundle();
  expect(indexJs).toContain('window.testFish="fish,FISH"');
  expect(indexJs).toContain('window.testCat="cat,CAT"');

  await rsbuild.close();
});

test('should import the constants as expected in dev', async ({ page }) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
  });
  await page.waitForFunction(() => window.testDog);
  expect(await page.evaluate(() => window.testFish)).toBe('fish,FISH');
  expect(await page.evaluate(() => window.testCat)).toBe('cat,CAT');
  expect(await page.evaluate(() => window.testDog)).toBe('dog,DOG');
  await rsbuild.close();
});
