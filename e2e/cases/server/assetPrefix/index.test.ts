import { dev, getRandomPort } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should match resource correctly with specify assetPrefix', async ({
  page,
}) => {
  const port = await getRandomPort();
  const rsbuild = await dev({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      dev: {
        assetPrefix: '/subpath/',
      },
      server: {
        port,
      },
    },
  });

  expect(rsbuild.port).toBe(port);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  await rsbuild.close();
});

test('should match resource correctly with full url assetPrefix', async ({
  page,
}) => {
  const port = await getRandomPort();
  const rsbuild = await dev({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      dev: {
        assetPrefix: `http://localhost:${port}/subpath/`,
      },
      server: {
        port,
      },
    },
  });

  expect(rsbuild.port).toBe(port);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  await rsbuild.close();
});
