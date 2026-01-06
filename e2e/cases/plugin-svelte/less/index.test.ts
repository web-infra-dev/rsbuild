import { expect, test } from '@e2e/helper';

test('should compile svelte component with less in build', async ({
  page,
  buildPreview,
}) => {
  await buildPreview();
  const title = page.locator('#title');
  await expect(title).toHaveText('Hello world!');
  // use the text color to assert the compilation result
  await expect(title).toHaveCSS('color', 'rgb(255, 62, 0)');
});

test('should compile svelte component with less in dev', async ({
  page,
  dev,
}) => {
  await dev();
  const title = page.locator('#title');
  await expect(title).toHaveText('Hello world!');
  // use the text color to assert the compilation result
  await expect(title).toHaveCSS('color', 'rgb(255, 62, 0)');
});
