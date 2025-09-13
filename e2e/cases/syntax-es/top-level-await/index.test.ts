import { expect, test } from '@e2e/helper';

test('should run top level await correctly', async ({ page, build }) => {
  await build();

  expect(await page.evaluate('window.foo')).toEqual('hello');
});
