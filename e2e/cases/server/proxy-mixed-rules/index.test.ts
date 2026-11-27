import { join } from 'node:path';
import { expect, test } from '@e2e/helper';
import { mergeRsbuildConfig, type RsbuildConfig } from '@rsbuild/core';

const cwd1 = join(import.meta.dirname, 'project1');
const cwd2 = join(import.meta.dirname, 'project2');

test('should apply mixed proxy rules', async ({ dev, page }) => {
  const rsbuild1 = await dev({
    cwd: cwd1,
    config: {
      server: {
        host: '0.0.0.0',
      },
      dev: {
        assetPrefix: true,
      },
    },
  });

  const target = `http://127.0.0.1:${rsbuild1.port}`;
  const rsbuild2 = await dev({
    cwd: cwd2,
    config: mergeRsbuildConfig<RsbuildConfig>(
      {
        server: {
          proxy: { '/foo': target },
        },
      },
      {
        server: {
          proxy: [{ pathFilter: '/bar', target }],
        },
      },
      {
        server: {
          proxy: {
            '/baz': { target },
          },
        },
      },
    ),
  });

  for (const path of ['/foo', '/bar', '/baz']) {
    await page.goto(`http://localhost:${rsbuild2.port}${path}`);
    expect(await page.innerHTML('body')).toContain('<div id="root">1</div>');
  }
});
