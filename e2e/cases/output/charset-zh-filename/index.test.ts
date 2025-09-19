import { expect, rspackTest } from '@e2e/helper';

const expected = '你好';

rspackTest('should resolve Chinese filename in dev', async ({ page, dev }) => {
  await dev();
  expect(await page.evaluate('window.test')).toBe(expected);
});

rspackTest(
  'should resolve Chinese filename in build',
  async ({ page, build }) => {
    await build();
    expect(await page.evaluate('window.test')).toBe(expected);
  },
);
