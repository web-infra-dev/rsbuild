import { expect, test } from '@e2e/helper';

test('should render basic React component', async ({
  page,
  runDevAndBuild,
}) => {
  await runDevAndBuild(async () => {
    const button = page.locator('#button');
    await expect(button).toHaveText('count: 0');
    await button.click();
    await expect(button).toHaveText('count: 1');
  });
});
