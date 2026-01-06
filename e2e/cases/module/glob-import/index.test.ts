import { expect, test } from '@e2e/helper';

test('should glob import components in dev build correctly', async ({
  page,
  dev,
}) => {
  await dev();

  await expect(page.locator('#header')).toHaveText('Header');
  await expect(page.locator('#footer')).toHaveText('Footer');
});

test('should glob import components in build correctly', async ({
  page,
  buildPreview,
}) => {
  await buildPreview();
  await expect(page.locator('#header')).toHaveText('Header');
  await expect(page.locator('#footer')).toHaveText('Footer');
});
