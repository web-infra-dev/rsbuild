import { expect, test } from '@e2e/helper';

test('should resolve package.json imports field', async ({
  page,
  runDevAndBuild,
}) => {
  await runDevAndBuild(async () => {
    const app = page.locator('#app');
    await expect(app).toHaveText('imports field works');
  });
});
