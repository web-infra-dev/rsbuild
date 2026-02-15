import { expect, test } from '@e2e/helper';

test('should apply server.setupMiddlewares in both dev and preview mode', async ({
  runBothServe,
}) => {
  await runBothServe(
    async ({ result }) => {
      const res = await fetch(`http://localhost:${result.port}/api/shared`);
      expect(await res.text()).toBe('shared-ok');
    },
    {
      config: {
        server: {
          setupMiddlewares: (middlewares) => {
            middlewares.unshift((req, res, next) => {
              if (req.url === '/api/shared') {
                res.end('shared-ok');
                return;
              }
              next();
            });
          },
        },
      },
    },
  );
});

test('should apply setupMiddlewares in preview mode', async ({
  page,
  buildPreview,
}) => {
  let middlewareCount = 0;

  await buildPreview({
    config: {
      server: {
        setupMiddlewares: (middlewares) => {
          middlewares.unshift((_req, _res, next) => {
            middlewareCount++;
            next();
          });
        },
      },
    },
  });

  const locator = page.locator('#root');
  await expect(locator).toHaveText('Hello Rsbuild!');
  expect(middlewareCount).toBeGreaterThanOrEqual(1);
});

test('should apply setupMiddlewares.unshift for custom API route', async ({
  buildPreview,
}) => {
  const rsbuild = await buildPreview({
    config: {
      server: {
        setupMiddlewares: (middlewares) => {
          middlewares.unshift((req, res, next) => {
            if (req.url === '/api/test') {
              res.end('api-ok');
              return;
            }
            next();
          });
        },
      },
    },
  });

  // Test custom API route via unshift
  const res = await fetch(`http://localhost:${rsbuild.port}/api/test`);
  expect(await res.text()).toBe('api-ok');
});

test('should support multiple setupMiddlewares functions', async ({
  page,
  buildPreview,
}) => {
  let firstCalled = false;
  let secondCalled = false;

  await buildPreview({
    config: {
      server: {
        setupMiddlewares: [
          (middlewares) => {
            middlewares.unshift((_req, _res, next) => {
              firstCalled = true;
              next();
            });
          },
          (middlewares) => {
            middlewares.unshift((_req, _res, next) => {
              secondCalled = true;
              next();
            });
          },
        ],
      },
    },
  });

  const locator = page.locator('#root');
  await expect(locator).toHaveText('Hello Rsbuild!');
  expect(firstCalled).toBe(true);
  expect(secondCalled).toBe(true);
});
