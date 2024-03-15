import { test, type Page, expect } from '@playwright/test';
import { build, gotoPage } from '@e2e/helper';
import { pluginLightningcss } from '@rsbuild/plugin-lightningcss';
import { pluginStylus } from '@rsbuild/plugin-stylus';
import { pluginSwc } from '@rsbuild/plugin-swc';

test('should minimize CSS correctly by lightningcss-minify', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      html: {
        template: './src/index.html',
      },
      plugins:
        process.env.PROVIDE_TYPE === 'rspack'
          ? [
              pluginLightningcss({
                transform: false,
              }),
            ]
          : [pluginSwc(), pluginLightningcss({ transform: false })],
    },
  });

  const files = await rsbuild.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.css'))!];

  expect(content).toContain(
    '.test-minify{color:#ffff00b3;background-color:#545c3d;border-color:#669;width:200px;height:calc(75.37% - 763.5px);transition:background .2s;transform:translateY(50px)}',
  );
});

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

test('should transform css by lightningcss-loader and work normally with other pre-processors', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
    rsbuildConfig: {
      html: {
        template: './src/index.html',
      },
      plugins: [
        pluginLightningcss({
          minify: false,
        }),
      ],
    },
  });
  const bundlerConfigs = await rsbuild.instance.initConfigs();
  expect(bundlerConfigs[0]).not.toContain('postcss-loader');
  await expectPageToBeNormal(page, rsbuild);
});

test('should transform css by lightningcss-loader and work with @rsbuild/plugin-stylus', async ({
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
      plugins: [
        pluginStylus(), // must before pluginLightningcss
        pluginLightningcss({
          minify: false,
        }),
      ],
    },
  });
  const bundlerConfigs = await rsbuild.instance.initConfigs();
  expect(bundlerConfigs[0]).not.toContain('postcss-loader');
  await expectPageToBeNormal(page, rsbuild);

  const stylusModuleLocator = page.locator('#test-stylus');
  await expect(stylusModuleLocator).toHaveCSS('color', 'rgb(165, 42, 42)');
});
