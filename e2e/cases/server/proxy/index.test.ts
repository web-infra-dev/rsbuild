import { join } from 'path';
import { expect, test } from '@playwright/test';
import { dev } from '@scripts/shared';

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

  await rsbuild1.server.close();
  await rsbuild2.server.close();
});
