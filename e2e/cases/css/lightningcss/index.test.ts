import { build, gotoPage } from '@e2e/helper';
import { type Page, expect, test } from '@playwright/test';
import { pluginLightningcss } from '@rsbuild/plugin-lightningcss';
import { pluginStylus } from '@rsbuild/plugin-stylus';

async function expectPageToBeNormal(
  page: Page,
  rsbuild: Awaited<ReturnType<typeof build>>,
) {
  await gotoPage(page, rsbuild);

  const h1Locator = page.locator('h1');
  await expect(h1Locator).toHaveCSS('color', 'rgb(255, 255, 0)');

  const nestingLocator = page.locator('.wrapper .blue');
  await expect(nestingLocator).toHaveCSS('color', 'rgb(0, 0, 255)');

  const colorMixLocator = page.locator('.wrapper .color-mix');
  await expect(colorMixLocator).toHaveCSS('color', 'rgb(112, 106, 67)');

  const lessModuleLocator = page.locator('#test-less');
  await expect(lessModuleLocator).toHaveCSS('color', 'rgb(0, 0, 255)');

  const scssModuleLocator = page.locator('#test-scss');
  await expect(scssModuleLocator).toHaveCSS('color', 'rgb(255, 0, 0)');

  await rsbuild.close();
}

test('should transform CSS by lightningcss-loader and work normally with other pre-processors', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
    rsbuildConfig: {
      html: {
        template: './src/index.html',
      },
      plugins: [pluginLightningcss()],
    },
  });
  const bundlerConfigs = await rsbuild.instance.initConfigs();
  expect(bundlerConfigs[0]).not.toContain('postcss-loader');
  await expectPageToBeNormal(page, rsbuild);
});

test('should transform CSS by lightningcss-loader and work with @rsbuild/plugin-stylus', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
    rsbuildConfig: {
      html: {
        template: './src/index.html',
      },
      source: {
        entry: {
          index: './src/_styl.js',
        },
      },
      plugins: [pluginLightningcss(), pluginStylus()],
    },
  });
  const bundlerConfigs = await rsbuild.instance.initConfigs();
  expect(bundlerConfigs[0]).not.toContain('postcss-loader');
  await expectPageToBeNormal(page, rsbuild);

  const stylusModuleLocator = page.locator('#test-stylus');
  await expect(stylusModuleLocator).toHaveCSS('color', 'rgb(165, 42, 42)');
});
