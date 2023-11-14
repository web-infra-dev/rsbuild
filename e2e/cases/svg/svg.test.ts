import { join } from 'path';
import { expect, test } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSvgr } from '@rsbuild/plugin-svgr';

const fixtures = __dirname;

test('svg (assets)', async ({ page }) => {
  const rsbuild = await build({
    cwd: join(fixtures, 'svg-assets'),
    entry: {
      main: join(fixtures, 'svg-assets', 'src/index.js'),
    },
    runServer: true,
  });

  await page.goto(getHrefByEntryName('main', rsbuild.port));

  // test svg asset
  await expect(
    page.evaluate(
      `document.getElementById('test-img').src.includes('static/svg/app')`,
    ),
  ).resolves.toBeTruthy();

  // test svg asset in css
  await expect(
    page.evaluate(
      `getComputedStyle(document.getElementById('test-css')).backgroundImage.includes('static/svg/app')`,
    ),
  ).resolves.toBeTruthy();

  await rsbuild.close();
});

test('svgr (defaultExport url)', async ({ page }) => {
  const rsbuild = await build({
    cwd: join(fixtures, 'svg'),
    entry: {
      main: join(fixtures, 'svg', 'src/index.js'),
    },
    runServer: true,
    plugins: [
      pluginReact(),
      pluginSvgr({
        svgDefaultExport: 'url',
      }),
    ],
  });

  await page.goto(getHrefByEntryName('main', rsbuild.port));

  // test svgr（namedExport）
  await expect(
    page.evaluate(`document.getElementById('test-svg').tagName === 'svg'`),
  ).resolves.toBeTruthy();

  // test svg asset
  await expect(
    page.evaluate(
      `document.getElementById('test-img').src.startsWith('data:image/svg')`,
    ),
  ).resolves.toBeTruthy();

  // test svg asset in css
  await expect(
    page.evaluate(
      `getComputedStyle(document.getElementById('test-css')).backgroundImage.includes('url("data:image/svg')`,
    ),
  ).resolves.toBeTruthy();

  await rsbuild.close();
});

test('svgr (defaultExport component)', async ({ page }) => {
  const rsbuild = await build({
    cwd: join(fixtures, 'svg-default-export-component'),
    entry: {
      main: join(fixtures, 'svg-default-export-component', 'src/index.js'),
    },
    runServer: true,
    rsbuildConfig: {},
    plugins: [
      pluginReact(),
      pluginSvgr({
        svgDefaultExport: 'component',
      }),
    ],
  });

  await page.goto(getHrefByEntryName('main', rsbuild.port));

  await expect(
    page.evaluate(`document.getElementById('test-svg').tagName === 'svg'`),
  ).resolves.toBeTruthy();

  await rsbuild.close();
});

test('svgr (query url)', async ({ page }) => {
  const rsbuild = await build({
    cwd: join(fixtures, 'svg-url'),
    entry: {
      main: join(fixtures, 'svg-url', 'src/index.js'),
    },
    plugins: [
      pluginReact(),
      pluginSvgr({
        svgDefaultExport: 'component',
      }),
    ],
    runServer: true,
  });

  await page.goto(getHrefByEntryName('main', rsbuild.port));

  // test svg asset
  await expect(
    page.evaluate(
      `document.getElementById('test-img').src.includes('static/svg/app')`,
    ),
  ).resolves.toBeTruthy();

  // test svg asset in css
  await expect(
    page.evaluate(
      `getComputedStyle(document.getElementById('test-css')).backgroundImage.includes('static/svg/app')`,
    ),
  ).resolves.toBeTruthy();

  await rsbuild.close();
});

// It's an old bug when use svgr in css and external react.
test('svgr (external react)', async ({ page }) => {
  const rsbuild = await build({
    cwd: join(fixtures, 'svg-external-react'),
    entry: {
      main: join(fixtures, 'svg-external-react', 'src/index.js'),
    },
    runServer: true,
    plugins: [
      pluginReact(),
      pluginSvgr({
        svgDefaultExport: 'url',
      }),
    ],
    rsbuildConfig: {
      output: {
        externals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
      html: {
        template: './static/index.html',
      },
    },
  });

  await page.goto(getHrefByEntryName('main', rsbuild.port));

  // test svgr（namedExport）
  await expect(
    page.evaluate(`document.getElementById('test-svg').tagName === 'svg'`),
  ).resolves.toBeTruthy();

  // test svg asset
  await expect(
    page.evaluate(
      `document.getElementById('test-img').src.startsWith('data:image/svg')`,
    ),
  ).resolves.toBeTruthy();

  // test svg asset in css
  await expect(
    page.evaluate(
      `getComputedStyle(document.getElementById('test-css')).backgroundImage.includes('url("data:image/svg')`,
    ),
  ).resolves.toBeTruthy();

  await rsbuild.close();
});
