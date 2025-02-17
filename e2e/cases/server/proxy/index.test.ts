import { join } from 'node:path';
import { dev, proxyConsole } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const prj1 = join(__dirname, 'project1');
const prj2 = join(__dirname, 'project2');

test('should apply basic proxy rules correctly', async ({ page }) => {
  const rsbuild1 = await dev({
    cwd: prj1,
    rsbuildConfig: {
      source: {
        entry: {
          main: join(prj1, 'src/index.js'),
        },
      },
    },
  });

  const rsbuild2 = await dev({
    cwd: prj2,
    rsbuildConfig: {
      source: {
        entry: {
          index: join(prj2, 'src/index.js'),
        },
      },
      server: {
        proxy: {
          // https://stackoverflow.com/a/76727711/6219457
          '/': `http://127.0.0.1:${rsbuild1.port}/`,
        },
      },
    },
  });

  await page.goto(`http://localhost:${rsbuild2.port}/main`);
  expect(await page.innerHTML('body')).toContain('<div id="root">1</div>');

  await rsbuild1.close();
  await rsbuild2.close();
});

test('should handle proxy error correctly', async ({ page }) => {
  const { logs, restore } = proxyConsole();
  const rsbuild1 = await dev({
    cwd: prj1,
    rsbuildConfig: {
      source: {
        entry: {
          main: join(prj1, 'src/index.js'),
        },
      },
      server: {
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        proxy: [
          {
            context: ['/api'],
            target: 'http://somepagewhichdoesnotexits.com:9000',
            changeOrigin: true,
            secure: false,
          },
        ],
      },
    },
  });

  const res = await page.goto(`http://localhost:${rsbuild1.port}/api`);

  expect(res?.status()).toBe(504);

  expect(
    logs.some((log) => log.includes('Error occurred while proxying request')),
  ).toBeTruthy();

  await rsbuild1.close();

  restore();
});
