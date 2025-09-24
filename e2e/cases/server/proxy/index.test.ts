import { join } from 'node:path';
import { expect, test } from '@e2e/helper';

const cwd1 = join(__dirname, 'project1');
const cwd2 = join(__dirname, 'project2');

test('should apply basic proxy rules', async ({ dev, page }) => {
  const rsbuild1 = await dev({
    cwd: cwd1,
    config: {
      dev: {
        assetPrefix: true,
      },
    },
  });

  const rsbuild2 = await dev({
    cwd: cwd2,
    config: {
      server: {
        proxy: {
          // https://stackoverflow.com/a/76727711/6219457
          '/': `http://127.0.0.1:${rsbuild1.port}/`,
        },
      },
    },
  });

  await page.goto(`http://localhost:${rsbuild2.port}/`);
  expect(await page.innerHTML('body')).toContain('<div id="root">1</div>');
});
