import { expect, test } from '@e2e/helper';

test('should apply server.base in dev', async ({ page, dev }) => {
  const rsbuild = await dev({
    rsbuildConfig: {
      server: {
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
});

test('should respect server.base when dev.assetPrefix is true', async ({
  page,
  dev,
}) => {
  const rsbuild = await dev({
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
});

test('should apply server.base in preview', async ({ page, build }) => {
  const rsbuild = await build({
    rsbuildConfig: {
      server: {
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
});

test('should serve resource correctly when assetPrefix is a subPath of server.base', async ({
  page,
  dev,
}) => {
  await dev({
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
});
