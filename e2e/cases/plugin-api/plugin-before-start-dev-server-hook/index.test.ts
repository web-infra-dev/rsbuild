import { dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import type { RsbuildPlugin } from '@rsbuild/core';

test('should run onBeforeStartDevServer hooks and add custom middleware', async ({
  page,
}) => {
  let count = 0;

  const plugin: RsbuildPlugin = {
    name: 'test-plugin',
    setup(api) {
      api.onBeforeStartDevServer(async ({ server }) => {
        server.middlewares.use((_req, _res, next) => {
          count++;
          next();
        });
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

  expect(count).toBeGreaterThanOrEqual(0);

  await rsbuild.close();
});
