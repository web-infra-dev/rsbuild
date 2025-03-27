import { dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should apply custom middleware via `setupMiddlewares`', async ({
  page,
}) => {
  // HMR cases will fail on Windows
  if (process.platform === 'win32') {
    test.skip();
  }

  let count = 0;
  let reloadFn: undefined | (() => void);

  // Only tested to see if it works, not all configurations.
  const rsbuild = await dev({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      dev: {
        setupMiddlewares: [
          (middlewares, server) => {
            middlewares.unshift((_req, _res, next) => {
              count++;
              next();
            });
            reloadFn = () => server.sockWrite('static-changed');
          },
        ],
      },
    },
  });

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  expect(count).toBeGreaterThanOrEqual(1);
  expect(reloadFn).toBeDefined();

  count = 0;
  reloadFn!();

  // check value of `i`
  const maxChecks = 100;
  let checks = 0;
  while (checks < maxChecks) {
    if (count === 0) {
      checks++;
      await new Promise((resolve) => setTimeout(resolve, 50));
    } else {
      break;
    }
  }

  expect(count).toBeGreaterThanOrEqual(1);

  await rsbuild.close();
});
