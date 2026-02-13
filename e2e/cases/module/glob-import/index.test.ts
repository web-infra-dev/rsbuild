import { expect, test } from '@e2e/helper';

test('should glob import components correctly', async ({
  page,
  runDevAndBuild,
}) => {
  await runDevAndBuild(async () => {
    await expect(page.locator('#header')).toHaveText('Header');
    await expect(page.locator('#footer')).toHaveText('Footer');
  });
});
