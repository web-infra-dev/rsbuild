import { expect, test } from '@e2e/helper';

test('should render basic React component in dev', async ({ page, dev }) => {
  await dev();

  const button = page.locator('#button');
  await expect(button).toHaveText('count: 0');
  await button.click();
  await expect(button).toHaveText('count: 1');
});

test('should render basic React component in build', async ({
  page,
  buildPreview,
}) => {
  await buildPreview();

  const button = page.locator('#button');
  await expect(button).toHaveText('count: 0');
  await button.click();
  await expect(button).toHaveText('count: 1');
});
