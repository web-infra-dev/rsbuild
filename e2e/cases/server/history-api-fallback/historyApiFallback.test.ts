import { join } from 'node:path';
import { expect, rspackOnlyTest, test } from '@e2e/helper';
import { pluginReact } from '@rsbuild/plugin-react';

const cwd = __dirname;

rspackOnlyTest(
  'should provide history api fallback for dev server correctly',
  async ({ page, devOnly }) => {
    const rsbuild = await devOnly({
      plugins: [pluginReact()],
      rsbuildConfig: {
        source: {
          entry: {
            main: join(cwd, 'src/index.jsx'),
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
  },
);

test('should provide history api fallback for preview server correctly', async ({
  page,
  build,
}) => {
  const rsbuild = await build({
    cwd,
    plugins: [pluginReact()],

    rsbuildConfig: {
      source: {
        entry: {
          main: join(cwd, 'src/index.jsx'),
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
});
