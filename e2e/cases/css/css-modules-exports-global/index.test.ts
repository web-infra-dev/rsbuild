import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should exports global in CSS Modules correctly in dev build',
  async ({ page, dev }) => {
    await dev();

    const test1Locator = page.locator('#test1');
    await expect(test1Locator).toHaveCSS('color', 'rgb(255, 0, 0)');

    const test2Locator = page.locator('#test2');
    await expect(test2Locator).toHaveCSS('color', 'rgb(0, 0, 255)');
  },
);

rspackOnlyTest(
  'should exports global in CSS Modules correctly in build',
  async ({ page, build }) => {
    const rsbuild = await build();

    const test1Locator = page.locator('#test1');
    await expect(test1Locator).toHaveCSS('color', 'rgb(255, 0, 0)');

    const test2Locator = page.locator('#test2');
    await expect(test2Locator).toHaveCSS('color', 'rgb(0, 0, 255)');

    const files = rsbuild.getDistFiles();
    const content =
      files[Object.keys(files).find((file) => file.endsWith('.css'))!];
    expect(content).toMatch(/\.foo-\w{6}{color:red}\.bar{color:#00f}/);
  },
);
