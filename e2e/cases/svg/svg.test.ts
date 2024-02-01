import fs from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { build, gotoPage } from '@e2e/helper';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSvgr } from '@rsbuild/plugin-svgr';

const fixtures = __dirname;

test('svg (assets)', async ({ page }) => {
  const rsbuild = await build({
    cwd: join(fixtures, 'svg-assets'),
    runServer: true,
    rsbuildConfig: {
      source: {
        entry: {
          index: join(fixtures, 'svg-assets', 'src/index.js'),
        },
      },
    },
  });

  await gotoPage(page, rsbuild);

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

test('svgr (defaultExport component)', async ({ page }) => {
  const rsbuild = await build({
    cwd: join(fixtures, 'svg-default-export-component'),
    runServer: true,
    rsbuildConfig: {},
    plugins: [
      pluginReact(),
      pluginSvgr({
        svgDefaultExport: 'component',
      }),
    ],
  });

  await gotoPage(page, rsbuild);

  await expect(
    page.evaluate(`document.getElementById('test-svg').tagName === 'svg'`),
  ).resolves.toBeTruthy();

  await rsbuild.close();
});

// It's an old bug when use svgr in css and external react.
test('svgr (external react)', async ({ page }) => {
  const nodeModulesPath = join(__dirname, '../../node_modules');
  const reactCode = fs.readFileSync(
    join(nodeModulesPath, 'react/umd/react.production.min.js'),
    'utf-8',
  );
  const reactDomCode = fs.readFileSync(
    join(nodeModulesPath, 'react-dom/umd/react-dom.production.min.js'),
    'utf-8',
  );

  const rsbuild = await build({
    cwd: join(fixtures, 'svg-external-react'),
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
        tags: [
          {
            tag: 'script',
            head: true,
            append: false,
            children: reactCode,
          },
          {
            tag: 'script',
            head: true,
            append: false,
            children: reactDomCode,
          },
        ],
        template: './static/index.html',
      },
    },
  });

  await gotoPage(page, rsbuild);

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
