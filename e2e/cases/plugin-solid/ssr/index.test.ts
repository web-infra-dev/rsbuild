import { expect, test } from '@e2e/helper';

test('should render and hydrate a Solid app', async ({ page, devOnly }) => {
  const rsbuild = await devOnly();

  const response = await page.goto(`http://localhost:${rsbuild.port}`);
  expect(await response?.text()).toContain('<button');

  const button = page.locator('#button');
  await expect(button).toHaveText('count: 0');

  await button.click();
  await expect(button).toHaveText('count: 1');
});
