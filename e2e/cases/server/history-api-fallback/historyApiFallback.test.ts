import { join } from 'path';
import { expect, test } from '@playwright/test';
import { dev, build } from '@scripts/shared';
import { rspackOnlyTest } from '@scripts/helper';
import { pluginReact } from '@rsbuild/plugin-react';

const cwd = __dirname;

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

    await rsbuild.server.close();
  },
);

test('should provide history api fallback for preview server correctly', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd,
    plugins: [pluginReact()],
    runServer: true,
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
