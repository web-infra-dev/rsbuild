import { expect, test } from '@e2e/helper';

test('should support worker query imports', async ({ page, runBothServe }) => {
  await runBothServe(async () => {
    await expect(page.locator('#worker')).toHaveText('named-query-worker: 42');
    await expect(page.locator('#mjs-worker')).toHaveText('mjs-worker: 42');
  });
});
