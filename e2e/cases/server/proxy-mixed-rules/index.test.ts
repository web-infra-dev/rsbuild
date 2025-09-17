import { join } from 'node:path';
import { expect, test } from '@e2e/helper';

const cwd1 = join(__dirname, 'project1');
const cwd2 = join(__dirname, 'project2');

test('should apply mixed proxy rules', async ({ dev, page }) => {
  const rsbuild1 = await dev({
    cwd: cwd1,
    rsbuildConfig: {
      dev: {
        assetPrefix: true,
      },
    },
  });

  const rsbuild2 = await dev({
    cwd: cwd2,
    rsbuildConfig: {
      server: {
        proxy: {
          '/foo': `http://127.0.0.1:${rsbuild1.port}/`,
          '/bar': {
            target: `http://127.0.0.1:${rsbuild1.port}/`,
          },
        },
      },
    },
  });

  await page.goto(`http://localhost:${rsbuild2.port}/foo`);
  expect(await page.innerHTML('body')).toContain('<div id="root">1</div>');
  await page.goto(`http://localhost:${rsbuild2.port}/bar`);
  expect(await page.innerHTML('body')).toContain('<div id="root">1</div>');
});
