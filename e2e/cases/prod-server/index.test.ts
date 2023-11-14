import { join } from 'path';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';

const fixtures = __dirname;

test('should access / success when entry is index', async ({ page }) => {
  const rsbuild = await build({
    cwd: fixtures,
    entry: {
      index: join(fixtures, 'src/index.ts'),
    },
    runServer: true,
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist-0',
        },
      },
    },
  });

  const url = new URL(`http://localhost:${rsbuild.port}/`);

  await page.goto(url.href);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  await rsbuild.close();
});

test('should access /main.html success when entry is main', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.ts'),
    },
    runServer: true,
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist-1',
        },
      },
    },
  });

  const url = new URL(`http://localhost:${rsbuild.port}/main.html`);

  await page.goto(url.href);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  await rsbuild.close();
});

test('should access /main success when entry is main', async ({ page }) => {
  const rsbuild = await build({
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.ts'),
    },
    runServer: true,
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist-2',
        },
      },
    },
  });

  const url = new URL(`http://localhost:${rsbuild.port}/main`);

  const res = await page.goto(url.href);

  expect(res?.status()).toBe(200);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  await rsbuild.close();
});

test('should access /main success when entry is main and set assetPrefix', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.ts'),
    },
    runServer: true,
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist-4',
        },
        assetPrefix: '/aaaa/',
      },
    },
  });

  const url = new URL(`http://localhost:${rsbuild.port}/main`);

  await page.goto(url.href);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  await rsbuild.close();
});

test('should access /main success when entry is main and outputPath is /main/index.html', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.ts'),
    },
    runServer: true,
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist-5',
        },
      },
      html: {
        outputStructure: 'nested',
      },
    },
  });

  const url = new URL(`http://localhost:${rsbuild.port}/main`);

  await page.goto(url.href);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  await rsbuild.close();
});

test('should return 404 when page is not found', async ({ page }) => {
  const rsbuild = await build({
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.ts'),
    },
    runServer: true,
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist-6',
        },
      },
    },
  });

  const url = new URL(`http://localhost:${rsbuild.port}/main1`);

  const res = await page.goto(url.href);

  expect(res?.status()).toBe(404);

  await rsbuild.close();
});

test('should access /html/main success when entry is main and outputPath is /html/main.html', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.ts'),
    },
    runServer: true,
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist-7',
          html: 'html',
        },
      },
    },
  });

  // access /html/main success
  const url = new URL(`http://localhost:${rsbuild.port}/html/main`);

  await page.goto(url.href);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  // access /main failed
  const url1 = new URL(`http://localhost:${rsbuild.port}/main`);

  const res = await page.goto(url1.href);

  expect(res?.status()).toBe(404);

  await rsbuild.close();
});
