import { expect, test } from '@e2e/helper';

test('should compile basic svelte component properly in build', async ({
  page,
  buildPreview,
}) => {
  await buildPreview();
  const title = page.locator('#title');
  await expect(title).toHaveText('Hello world!');
});

test('should compile basic svelte component properly in dev', async ({
  page,
  dev,
}) => {
  await dev();
  const title = page.locator('#title');
  await expect(title).toHaveText('Hello world!');
});
