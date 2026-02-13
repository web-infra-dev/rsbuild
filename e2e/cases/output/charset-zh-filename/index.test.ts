import { expect, test } from '@e2e/helper';

const expected = '你好';

test('should resolve Chinese filename', async ({ page, runDevAndBuild }) => {
  await runDevAndBuild(async () => {
    expect(await page.evaluate('window.test')).toBe(expected);
  });
});
