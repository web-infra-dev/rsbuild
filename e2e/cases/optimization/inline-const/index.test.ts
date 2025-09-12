import { expect, rspackOnlyTest, test } from '@e2e/helper';

rspackOnlyTest(
  'should inline the constants in build',
  async ({ page, build }) => {
    const rsbuild = await build();
    await page.waitForFunction(() => window.testDog);
    expect(await page.evaluate(() => window.testFish)).toBe('fish,FISH');
    expect(await page.evaluate(() => window.testCat)).toBe('cat,CAT');
    expect(await page.evaluate(() => window.testDog)).toBe('dog,DOG');

    const indexJs = await rsbuild.getIndexBundle();
    expect(indexJs).toContain('window.testFish="fish,FISH"');
    expect(indexJs).toContain('window.testCat="cat,CAT"');
  },
);

test('should import the constants as expected in dev', async ({
  page,
  dev,
}) => {
  await dev();
  await page.waitForFunction(() => window.testDog);
  expect(await page.evaluate(() => window.testFish)).toBe('fish,FISH');
  expect(await page.evaluate(() => window.testCat)).toBe('cat,CAT');
  expect(await page.evaluate(() => window.testDog)).toBe('dog,DOG');
});
