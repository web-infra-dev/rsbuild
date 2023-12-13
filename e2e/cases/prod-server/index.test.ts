import { join } from 'path';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';

const fixtures = __dirname;

test('should access / and htmlFallback success by default', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: fixtures,
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

  const url1 = new URL(`http://localhost:${rsbuild.port}/aaaa`);

  await page.goto(url1.href);

  await expect(page.locator('#test')).toHaveText('Hello Rsbuild!');

  await rsbuild.close();
});

test('should return 404 when htmlFallback false', async ({ page }) => {
  const rsbuild = await build({
    cwd: fixtures,
    runServer: true,
    rsbuildConfig: {
      server: {
        htmlFallback: false,
      },
      output: {
        distPath: {
          root: 'dist-0',
        },
      },
    },
  });

  const url = new URL(`http://localhost:${rsbuild.port}/aaaaa`);

  const res = await page.goto(url.href);

  expect(res?.status()).toBe(404);

  await rsbuild.close();
});

test('should access /main.html success when entry is main', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: fixtures,
    runServer: true,
    rsbuildConfig: {
      source: {
        entry: {
          main: join(fixtures, 'src/index.ts'),
        },
      },
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
    runServer: true,
    rsbuildConfig: {
      source: {
        entry: {
          main: join(fixtures, 'src/index.ts'),
        },
      },
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
    runServer: true,
    rsbuildConfig: {
      source: {
        entry: {
          main: join(fixtures, 'src/index.ts'),
        },
      },
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
    runServer: true,
    rsbuildConfig: {
      source: {
        entry: {
          main: join(fixtures, 'src/index.ts'),
        },
      },
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
    runServer: true,
    rsbuildConfig: {
      source: {
        entry: {
          main: join(fixtures, 'src/index.ts'),
        },
      },
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
    runServer: true,
    rsbuildConfig: {
      source: {
        entry: {
          main: join(fixtures, 'src/index.ts'),
        },
      },
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
