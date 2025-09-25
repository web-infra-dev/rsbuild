import { expect, test } from '@e2e/helper';

test('should inject styles and not emit CSS files when output.injectStyles is true', async ({
  page,
  buildPreview,
}) => {
  const rsbuild = await buildPreview();

  // injectStyles worked
  const files = rsbuild.getDistFiles();
  const cssFiles = Object.keys(files).filter((file) => file.endsWith('.css'));

  expect(cssFiles.length).toBe(0);

  // scss worked
  const header = page.locator('#header');
  await expect(header).toHaveCSS('font-size', '20px');

  // less worked
  const title = page.locator('#title');
  await expect(title).toHaveCSS('font-size', '20px');
});
