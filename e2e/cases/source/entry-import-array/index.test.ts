import { expect, test } from '@e2e/helper';

test('should support entry import array in dev', async ({ page, dev }) => {
  await dev();
  await expect(page.locator('#app')).toHaveText('first,second');
});

test('should support entry import array in build', async ({
  page,
  buildPreview,
}) => {
  await buildPreview();
  await expect(page.locator('#app')).toHaveText('first,second');
});
