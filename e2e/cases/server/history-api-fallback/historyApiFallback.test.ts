import { join } from 'node:path';
import { build, dev, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginReact } from '@rsbuild/plugin-react';

const cwd = import.meta.dirname;

rspackOnlyTest(
  'should provide history api fallback for dev server correctly',
  async ({ page }) => {
    const rsbuild = await dev({
      cwd,
      plugins: [pluginReact()],
      rsbuildConfig: {
        source: {
          entry: {
            main: join(cwd, 'src/index.jsx'),
          },
        },
        output: {
          distPath: {
            root: 'dist-historyApiFallback',
          },
        },
        server: {
          historyApiFallback: {
            index: '/main.html',
          },
        },
      },
    });

    await page.goto(`http://localhost:${rsbuild.port}`);
    expect(await page.innerHTML('body')).toContain('<div>home<div>');

    await page.goto(`http://localhost:${rsbuild.port}/a`);
    expect(await page.innerHTML('body')).toContain('<div>A</div>');

    await page.goto(`http://localhost:${rsbuild.port}/b`);
    expect(await page.innerHTML('body')).toContain('<div>B</div>');

    await rsbuild.close();
  },
);

test('should provide history api fallback for preview server correctly', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd,
    plugins: [pluginReact()],
    page,
    rsbuildConfig: {
      source: {
        entry: {
          main: join(cwd, 'src/index.jsx'),
        },
      },
      output: {
        distPath: {
          root: 'dist-historyApiFallback',
        },
      },
      server: {
        historyApiFallback: {
          index: '/main.html',
        },
      },
    },
  });

  await page.goto(`http://localhost:${rsbuild.port}`);
  expect(await page.innerHTML('body')).toContain('<div>home<div>');

  await page.goto(`http://localhost:${rsbuild.port}/a`);
  expect(await page.innerHTML('body')).toContain('<div>A</div>');

  await page.goto(`http://localhost:${rsbuild.port}/b`);
  expect(await page.innerHTML('body')).toContain('<div>B</div>');

  await rsbuild.close();
});
