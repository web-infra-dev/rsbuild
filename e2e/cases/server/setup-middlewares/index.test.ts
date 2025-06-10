import { dev, expectPoll } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should apply custom middleware via `setupMiddlewares`', async ({
  page,
}) => {
  let count = 0;

  // Only tested to see if it works, not all configurations.
  const rsbuild = await dev({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      dev: {
        setupMiddlewares: [
          (middlewares) => {
            middlewares.unshift((_req, _res, next) => {
              count++;
              next();
            });
          },
        ],
      },
    },
  });

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');
  expect(count).toBeGreaterThanOrEqual(1);
  await rsbuild.close();
});

test('should apply to trigger page reload via the `static-changed` type of sockWrite', async ({
  page,
}) => {
  // HMR cases will fail on Windows
  if (process.platform === 'win32') {
    test.skip();
  }

  let count = 0;
  let reloadPage: undefined | (() => void);

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
            reloadPage = () => server.sockWrite('static-changed');
          },
        ],
      },
    },
  });

  const previousCount = count;
  reloadPage?.();
  expectPoll(() => count > previousCount).toBeTruthy();
  await rsbuild.close();
});
