import { expect, getFileContent, test } from '@e2e/helper';

test('should exports global in CSS Modules correctly in dev build', async ({
  page,
  dev,
}) => {
  await dev();

  const test1Locator = page.locator('#test1');
  await expect(test1Locator).toHaveCSS('color', 'rgb(255, 0, 0)');

  const test2Locator = page.locator('#test2');
  await expect(test2Locator).toHaveCSS('color', 'rgb(0, 0, 255)');
});

test('should exports global in CSS Modules correctly in build', async ({
  page,
  buildPreview,
}) => {
  const rsbuild = await buildPreview();

  const test1Locator = page.locator('#test1');
  await expect(test1Locator).toHaveCSS('color', 'rgb(255, 0, 0)');

  const test2Locator = page.locator('#test2');
  await expect(test2Locator).toHaveCSS('color', 'rgb(0, 0, 255)');

  const files = rsbuild.getDistFiles();
  const content = getFileContent(files, 'index.css');
  expect(content).toMatch(/\.foo-\w{6}{color:red}\.bar{color:#00f}/);
});
