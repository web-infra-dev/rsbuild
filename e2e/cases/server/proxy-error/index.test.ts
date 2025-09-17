import { expect, test } from '@e2e/helper';

test('should handle proxy error', async ({ dev, page }) => {
  const rsbuild = await dev();

  const res = await page.goto(`http://localhost:${rsbuild.port}/api`);
  expect(res?.status()).toBe(504);
  await rsbuild.expectLog('Error occurred while proxying request');
});
