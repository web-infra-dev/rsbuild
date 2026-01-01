import { expect, test } from '@e2e/helper';

test('should resolve package.json imports field in dev', async ({
  page,
  dev,
}) => {
  await dev();

  const app = page.locator('#app');
  await expect(app).toHaveText('imports field works');
});

test('should resolve package.json imports field in build', async ({
  page,
  buildPreview,
}) => {
  await buildPreview();

  const app = page.locator('#app');
  await expect(app).toHaveText('imports field works');
});
