import { expect, rspackOnlyTest, test } from '@e2e/helper';

rspackOnlyTest(
  'should inline the enum values in build',
  async ({ page, build }) => {
    await build();

    await page.waitForFunction(() => window.testDog);
    expect(await page.evaluate(() => window.testFish)).toBe('fish,FISH');
    expect(await page.evaluate(() => window.testCat)).toBe('cat,CAT');
    expect(await page.evaluate(() => window.testDog)).toBe('dog,DOG');
    expect(await page.evaluate(() => window.testNumbers)).toBe(
      '0,1,10,1.1,1.0,-1,-1.1',
    );

    // TODO: enable inline enum optimization
    // const indexJs = await rsbuild.getIndexBundle();
    // expect(indexJs).toContain('window.testFish="fish,FISH"');
    // expect(indexJs).toContain('window.testCat="cat,CAT"');
    // expect(indexJs).toContain('window.testNumbers="0,1,10,1.1,1.0,-1,-1.1"');
  },
);

test('should import the enum values as expected in dev', async ({
  page,
  dev,
}) => {
  await dev();

  await page.waitForFunction(() => window.testDog);
  expect(await page.evaluate(() => window.testFish)).toBe('fish,FISH');
  expect(await page.evaluate(() => window.testCat)).toBe('cat,CAT');
  expect(await page.evaluate(() => window.testDog)).toBe('dog,DOG');
  expect(await page.evaluate(() => window.testNumbers)).toBe(
    '0,1,10,1.1,1.0,-1,-1.1',
  );
});
