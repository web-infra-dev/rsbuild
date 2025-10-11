import { expect, test } from '@e2e/helper';

test('should expose the environment API in setupMiddlewares', async ({
  dev,
  page,
}) => {
  let assertionsCount = 0;

  const rsbuild = await dev({
    config: {
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
