import { join } from 'path';
import { fse } from '@rsbuild/shared';
import { expect, test } from '@playwright/test';
import { dev, getHrefByEntryName } from '@scripts/shared';
import { pluginReact } from '@rsbuild/plugin-react';

const fixtures = __dirname;

test('dev.port & output.distPath', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const rsbuild = await dev({
    cwd: join(fixtures, 'basic'),
    plugins: [pluginReact()],
    rsbuildConfig: {
      dev: {
        port: 3000,
      },
      output: {
        distPath: {
          root: 'dist-1',
          js: 'aa/js',
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('index', rsbuild.port));

  expect(rsbuild.port).toBe(3000);

  expect(
    fse.existsSync(join(fixtures, 'basic/dist-1/index.html')),
  ).toBeTruthy();

  expect(fse.existsSync(join(fixtures, 'basic/dist-1/aa/js'))).toBeTruthy();

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  await rsbuild.server.close();

  expect(errors).toEqual([]);

  await fse.remove(join(fixtures, 'basic/dist-1'));
});

test('devServer', async ({ page }) => {
  let i = 0;
  let reloadFn: undefined | (() => void);

  // Only tested to see if it works, not all configurations.
  const rsbuild = await dev({
    cwd: join(fixtures, 'basic'),
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist-dev-server',
        },
      },
      tools: {
        devServer: {
          setupMiddlewares: [
            (middlewares, server) => {
              middlewares.unshift((req, res, next) => {
                i++;
                next();
              });
              reloadFn = () => server.sockWrite('content-changed');
            },
          ],
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('index', rsbuild.port));

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  expect(i).toBeGreaterThanOrEqual(1);
  expect(reloadFn).toBeDefined();

  i = 0;
  reloadFn!();

  // wait for page reload take effect
  await new Promise((resolve) => setTimeout(resolve, 2000));

  expect(i).toBeGreaterThanOrEqual(1);

  await rsbuild.server.close();
});
