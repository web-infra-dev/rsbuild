import { build, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('server.base when dev', async ({ page }) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      server: {
        printUrls: true,
        base: '/base',
      },
    },
  });

  // should redirect root visit to based url
  await expect(page.locator('#test')).toHaveText('Hello Rsbuild!');

  expect(page.url().includes('/base/')).toBeTruthy();

  // should print url with base path
  const baseUrlLog = rsbuild.logs.find(
    (log) =>
      log.includes('Local:') && log.includes(`localhost:${rsbuild.port}/base`),
  );

  expect(baseUrlLog).toBeTruthy();

  // should visit base url correctly
  await page.goto(`http://localhost:${rsbuild.port}/base`);

  await expect(page.locator('#test')).toHaveText('Hello Rsbuild!');

  // should 404 when visit resource without base prefix
  const indexRes = await page.goto(`http://localhost:${rsbuild.port}/a`);
  expect(indexRes?.status()).toBe(404);
  expect(await page.content()).toContain(
    'The server is configured with a base URL of /base',
  );

  // should visit public dir correctly with base prefix
  await page.goto(`http://localhost:${rsbuild.port}/base/aaa.txt`);

  expect(await page.content()).toContain('aaaa');

  await rsbuild.close();
});

test('server.base with dev.assetPrefix: true', async ({ page }) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      server: {
        base: '/base',
      },
      dev: {
        assetPrefix: true,
      },
    },
  });

  // should visit base url correctly
  await page.goto(`http://localhost:${rsbuild.port}/base`);
  await expect(page.locator('#test')).toHaveText('Hello Rsbuild!');

  // should visit public dir correctly with base prefix
  await page.goto(`http://localhost:${rsbuild.port}/base/aaa.txt`);
  expect(await page.content()).toContain('aaaa');

  await rsbuild.close();
});

test('server.base when build & preview', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      server: {
        printUrls: true,
        base: '/base',
      },
    },
  });

  // should redirect root visit to based url
  await expect(page.locator('#test')).toHaveText('Hello Rsbuild!');

  expect(page.url().includes('/base/')).toBeTruthy();

  // should print url with base path
  const baseUrlLog = rsbuild.logs.find(
    (log) =>
      log.includes('Local:') && log.includes(`localhost:${rsbuild.port}/base`),
  );

  expect(baseUrlLog).toBeTruthy();

  // should visit base url correctly
  await page.goto(`http://localhost:${rsbuild.port}/base`);

  await expect(page.locator('#test')).toHaveText('Hello Rsbuild!');

  // should 404 when visit resource without base prefix
  const indexRes = await page.goto(`http://localhost:${rsbuild.port}/a`);
  expect(indexRes?.status()).toBe(404);
  expect(await page.content()).toContain(
    'The server is configured with a base URL of /base',
  );

  // should visit public dir correctly with base prefix
  await page.goto(`http://localhost:${rsbuild.port}/base/aaa.txt`);

  expect(await page.content()).toContain('aaaa');

  await rsbuild.close();
});

test('should serve resource correctly when assetPrefix is a subPath of server.base', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      dev: {
        assetPrefix: '/base/aaa',
      },
      server: {
        base: '/base',
      },
    },
  });

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  await rsbuild.close();
});
