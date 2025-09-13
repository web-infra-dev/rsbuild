import { expect, test } from '@e2e/helper';

test('should resolve package.json#imports correctly in dev build', async ({
  page,
  dev,
}) => {
  await dev();
  const foo = page.locator('#foo');
  await expect(foo).toHaveText('foo');
  const test = page.locator('#test');
  await expect(test).toHaveText('test');
});

test('should resolve package.json#imports correctly in build', async ({
  page,
  buildPreview,
}) => {
  await buildPreview();
  const foo = page.locator('#foo');
  await expect(foo).toHaveText('foo');
  const test = page.locator('#test');
  await expect(test).toHaveText('test');
});
