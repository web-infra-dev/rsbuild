import { expect, rspackTest, test } from '@e2e/helper';

rspackTest(
  'should inline the enum values in build',
  async ({ page, buildPreview }) => {
    const result = await buildPreview();

    await page.waitForFunction(() => window.testDog);
    expect(await page.evaluate(() => window.testFish)).toBe('fish,FISH');
    expect(await page.evaluate(() => window.testCat)).toBe('cat,CAT');
    expect(await page.evaluate(() => window.testDog)).toBe('dog,DOG');
    expect(await page.evaluate(() => window.testNumbers)).toBe(
      '0,1,10,1.1,1.0,-1,-1.1',
    );

    const indexJs = await result.getIndexBundle();
    expect(indexJs).toContain('window.testFish="fish,FISH"');
    expect(indexJs).toContain('window.testCat="cat,CAT"');
    // minus values cannot be inlined
    expect(indexJs).toContain('window.testNumbers=`0,1,10,1.1,1.0');
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
