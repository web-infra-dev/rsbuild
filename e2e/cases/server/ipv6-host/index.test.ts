import { URL } from 'node:url';
import { expect, test } from '@e2e/helper';

test('should listen on an IPv6 host', async ({ page, devOnly }) => {
  const rsbuild = await devOnly();

  await page.goto(new URL(`http://[::1]:${rsbuild.port}`).href);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');
});

test('should load assets when dev.assetPrefix is true with an IPv6 host', async ({
  page,
  devOnly,
}) => {
  const rsbuild = await devOnly({
    config: {
      dev: {
        assetPrefix: true,
      },
    },
  });

  await page.goto(new URL(`http://[::1]:${rsbuild.port}`).href);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');
  await expect(page.locator('script[src$="index.js"]')).toHaveAttribute(
    'src',
    `http://[::1]:${rsbuild.port}/static/js/index.js`,
  );
});

test('should use localhost in dev.assetPrefix for the IPv6 wildcard host', async ({
  page,
  devOnly,
}) => {
  const rsbuild = await devOnly({
    config: {
      server: {
        host: '::',
      },
      dev: {
        assetPrefix: true,
      },
    },
  });

  await page.goto(`http://localhost:${rsbuild.port}`);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');
  await expect(page.locator('script[src$="index.js"]')).toHaveAttribute(
    'src',
    `http://localhost:${rsbuild.port}/static/js/index.js`,
  );
});
