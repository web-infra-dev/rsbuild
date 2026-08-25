import { expect, test } from '@e2e/helper';

test('should support Babel compiler', async ({ page, buildPreview }) => {
  await buildPreview();

  const button = page.locator('#button');
  await expect(button).toHaveText('count: 0');

  await button.click();
  await expect(button).toHaveText('count: 1');
});
