import { expect, test } from '@e2e/helper';

test('should support entry import array', async ({ page, runDevAndBuild }) => {
  await runDevAndBuild(async () => {
    await expect(page.locator('#app')).toHaveText('first,second');
  });
});
