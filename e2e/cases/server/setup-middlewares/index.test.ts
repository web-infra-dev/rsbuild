import { expect, test } from '@e2e/helper';

test('should apply custom middleware via `server.setup`', async ({
  page,
  dev,
}) => {
  let count = 0;

  await dev({
    config: {
      server: {
        setup: ({ action, server }) => {
          if (action !== 'dev') {
            return;
          }

          server.middlewares.use((_req, _res, next) => {
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

test('should apply to trigger page reload via `environment.hot.send` in server.setup', async ({
  page,
  dev,
}) => {
  let reloadPage: undefined | (() => void);

  await dev({
    config: {
      server: {
        setup: ({ action, server }) => {
          if (action !== 'dev') {
            return;
          }

          reloadPage = () => server.environments.web.hot.send('full-reload');
        },
      },
    },
  });

  await expect(page.locator('#test')).toHaveText('Hello Rsbuild!');
  const loaded = page.waitForEvent('load');
  reloadPage?.();
  await loaded;
  await expect(page.locator('#test')).toHaveText('Hello Rsbuild!');
});
