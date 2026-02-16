import { expect, expectPoll, test } from '@e2e/helper';

test('should apply custom middleware via `setupMiddlewares`', async ({
  page,
  dev,
}) => {
  let count = 0;

  // Only tested to see if it works, not all configurations.
  await dev({
    config: {
      dev: {
        setupMiddlewares: (middlewares) => {
          middlewares.unshift((_req, _res, next) => {
            count++;
            next();
          });
        },
      },
    },
  });

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');
  expect(count).toBeGreaterThanOrEqual(1);
});

test('should apply to trigger page reload via the `static-changed` type of sockWrite', async ({
  dev,
}) => {
  let count = 0;
  let reloadPage: undefined | (() => void);

  // Only tested to see if it works, not all configurations.
  await dev({
    config: {
      dev: {
        setupMiddlewares: (middlewares, { sockWrite }) => {
          middlewares.unshift((_req, _res, next) => {
            count++;
            next();
          });
          reloadPage = () => sockWrite('static-changed');
        },
      },
    },
  });

  const previousCount = count;
  reloadPage?.();
  expectPoll(() => count > previousCount).toBeTruthy();
});

test('should expose dev-only abilities via server.setup context', async ({
  dev,
}) => {
  let count = 0;
  let reloadPage: undefined | (() => void);

  await dev({
    config: {
      server: {
        setup: (context) => {
          if (context.action !== 'dev') {
            return;
          }

          context.server.middlewares.use((_req, _res, next) => {
            count++;
            next();
          });

          reloadPage = () => context.server.sockWrite('static-changed');
        },
      },
    },
  });

  const previousCount = count;
  reloadPage?.();
  expectPoll(() => count > previousCount).toBeTruthy();
});
