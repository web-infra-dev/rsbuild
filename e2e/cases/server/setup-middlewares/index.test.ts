import { dev, gotoPage } from '@e2e/helper';
import { expect, test } from '@playwright/test';

// hmr will timeout in CI
test('setupMiddlewares', async ({ page }) => {
  // HMR cases will fail in Windows
  if (process.platform === 'win32') {
    test.skip();
  }

  let i = 0;
  let reloadFn: undefined | (() => void);

  // Only tested to see if it works, not all configurations.
  const rsbuild = await dev({
    cwd: __dirname,
    rsbuildConfig: {
      dev: {
        setupMiddlewares: [
          (middlewares, server) => {
            middlewares.unshift((_req, _res, next) => {
              i++;
              next();
            });
            reloadFn = () => server.sockWrite('content-changed');
          },
        ],
      },
    },
  });

  await gotoPage(page, rsbuild);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  expect(i).toBeGreaterThanOrEqual(1);
  expect(reloadFn).toBeDefined();

  i = 0;
  reloadFn!();

  // check value of `i`
  const maxChecks = 100;
  let checks = 0;
  while (checks < maxChecks) {
    if (i === 0) {
      checks++;
      await new Promise((resolve) => setTimeout(resolve, 50));
    } else {
      break;
    }
  }

  expect(i).toBeGreaterThanOrEqual(1);

  await rsbuild.close();
});
