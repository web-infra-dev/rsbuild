import { buildEntryUrl, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import type { RsbuildPlugin } from '@rsbuild/core';

test('should run onBeforeStartDevServer hooks and add custom middleware', async ({
  page,
}) => {
  const plugin: RsbuildPlugin = {
    name: 'test-plugin',
    setup(api) {
      api.onBeforeStartDevServer(async ({ server }) => {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/test.html') {
            res.end('Hello, world!');
          } else {
            next();
          }
        });

        return () => {
          server.middlewares.use((req, res, next) => {
            if (req.url === '/test2.html') {
              res.end('Hello, world2!');
            } else {
              next();
            }
          });
        };
      });
    },
  };

  const rsbuild = await dev({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      plugins: [plugin],
    },
  });

  const testUrl = buildEntryUrl('test', rsbuild.port);
  const test2Url = buildEntryUrl('test2', rsbuild.port);

  await page.goto(testUrl);
  await expect(page.content()).resolves.toContain('Hello, world!');

  await page.goto(test2Url);
  await expect(page.content()).resolves.toContain('Hello, world2!');

  await rsbuild.close();
});
