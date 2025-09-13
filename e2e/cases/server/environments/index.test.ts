import { expect, test } from '@e2e/helper';

test('should serve multiple environments correctly', async ({ dev, page }) => {
  const rsbuild = await dev({
    rsbuildConfig: {
      environments: {
        web: {},
        web1: {
          dev: {
            // When generating outputs for multiple web environments,
            // if assetPrefix is not added, file search conflicts will occur.
            assetPrefix: 'auto',
          },
          source: {
            entry: {
              main: './src/web1.js',
            },
          },
          output: {
            distPath: {
              root: 'dist/web1',
              html: 'html1',
            },
          },
        },
      },
    },
  });

  await page.goto(`http://localhost:${rsbuild.port}`);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  await page.goto(`http://localhost:${rsbuild.port}/web1/html1/main`);

  const locator1 = page.locator('#test');
  await expect(locator1).toHaveText('Hello Rsbuild (web1)!');
});

test('should expose the environment API in setupMiddlewares', async ({
  dev,
  page,
}) => {
  let assertionsCount = 0;

  const rsbuild = await dev({
    rsbuildConfig: {
      dev: {
        setupMiddlewares: (middlewares, { environments }) => {
          middlewares.unshift(async (req, _res, next) => {
            if (req.url === '/') {
              const webStats = await environments.web.getStats();

              expect(webStats.toJson().name).toBe('web');

              assertionsCount++;
              const web1Stats = await environments.web1.getStats();

              expect(web1Stats.toJson().name).toBe('web1');
              assertionsCount++;
            }

            next();
          });
        },
      },
      environments: {
        web: {},
        web1: {
          source: {
            entry: {
              main: './src/web1.js',
            },
          },
          output: {
            distPath: {
              root: 'dist/web1',
              html: 'html1',
            },
          },
        },
      },
    },
  });

  await page.goto(`http://localhost:${rsbuild.port}`);

  expect(assertionsCount).toBe(2);
});

// TODO: not support serve multiple environments when distPath different
test.skip('serve multiple environments correctly when distPath different', async ({
  dev,
  page,
}) => {
  const rsbuild = await dev({
    rsbuildConfig: {
      environments: {
        web: {},
        web1: {
          dev: {
            assetPrefix: 'auto',
          },
          source: {
            entry: {
              main: './src/web1.js',
            },
          },
          output: {
            distPath: {
              root: 'dist1',
              html: 'html1',
            },
          },
        },
      },
    },
  });

  await page.goto(`http://localhost:${rsbuild.port}/dist`);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  await page.goto(`http://localhost:${rsbuild.port}/dist1/html1/main`);

  const locator1 = page.locator('#test');
  await expect(locator1).toHaveText('Hello Rsbuild (web1)!');
});
