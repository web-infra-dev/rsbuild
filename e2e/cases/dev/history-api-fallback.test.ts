import { join } from 'path';
import { expect, test } from '@playwright/test';
import { dev } from '@scripts/shared';
import { pluginReact } from '@rsbuild/plugin-react';

const cwd = join(__dirname, 'history-api-fallback');

test('should provide history api fallback correctly', async ({ page }) => {
  const rsbuild = await dev({
    cwd,
    entry: {
      main: join(cwd, 'src/index.tsx'),
    },
    plugins: [pluginReact()],
    rsbuildConfig: {
      tools: {
        devServer: {
          historyApiFallback: {
            index: '/main.html',
          },
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
});
