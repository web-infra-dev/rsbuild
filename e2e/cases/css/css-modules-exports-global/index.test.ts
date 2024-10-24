import { build, dev, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should exports global in CSS Modules correctly in dev build',
  async ({ page }) => {
    const rsbuild = await dev({
      cwd: __dirname,
      page,
    });

    const test1Locator = page.locator('#test1');
    await expect(test1Locator).toHaveCSS('color', 'rgb(255, 0, 0)');

    const test2Locator = page.locator('#test2');
    await expect(test2Locator).toHaveCSS('color', 'rgb(0, 0, 255)');

    await rsbuild.close();
  },
);

rspackOnlyTest(
  'should exports global in CSS Modules correctly in prod build',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
    });

    const test1Locator = page.locator('#test1');
    await expect(test1Locator).toHaveCSS('color', 'rgb(255, 0, 0)');

    const test2Locator = page.locator('#test2');
    await expect(test2Locator).toHaveCSS('color', 'rgb(0, 0, 255)');

    await rsbuild.close();

    const files = await rsbuild.unwrapOutputJSON();
    const content =
      files[Object.keys(files).find((file) => file.endsWith('.css'))!];
    expect(content).toMatch(/\.foo-\w{6}{color:red}\.bar{color:#00f}/);
  },
);
