import { join } from 'path';
import { expect, test } from '@playwright/test';
import { dev } from '@scripts/shared';

const fixtures = __dirname;

test('should access / success when entry is index', async ({ page }) => {
  const rsbuild = await dev({
    cwd: join(fixtures, 'basic'),
    entry: {
      index: join(fixtures, 'basic', 'src/index.ts'),
    },
    rsbuildConfig: {
      dev: {
        devMiddleware: {
          writeToDisk: true,
        },
      },
      output: {
        distPath: {
          root: 'dist-html-fallback-0',
        },
      },
    },
  });

  const url = new URL(`http://localhost:${rsbuild.port}/`);

  await page.goto(url.href);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  await rsbuild.server.close();
});

test('should access /main.html success when entry is main', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: join(fixtures, 'basic'),
    entry: {
      main: join(fixtures, 'basic', 'src/index.ts'),
    },
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist-html-fallback-1',
        },
      },
      dev: {
        devMiddleware: {
          writeToDisk: true,
        },
      },
    },
  });

  const url = new URL(`http://localhost:${rsbuild.port}/main.html`);

  await page.goto(url.href);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  await rsbuild.server.close();
});

test('should access /main success when entry is main', async ({ page }) => {
  const rsbuild = await dev({
    cwd: join(fixtures, 'basic'),
    entry: {
      main: join(fixtures, 'basic', 'src/index.ts'),
    },
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist-html-fallback-2',
        },
      },
      dev: {
        devMiddleware: {
          writeToDisk: true,
        },
      },
    },
  });

  const url = new URL(`http://localhost:${rsbuild.port}/main`);

  const res = await page.goto(url.href);

  expect(res?.status()).toBe(200);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  await rsbuild.server.close();
});

test('should access /main success when entry is main and use memoryFs', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: join(fixtures, 'basic'),
    entry: {
      main: join(fixtures, 'basic', 'src/index.ts'),
    },
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist-html-fallback-3',
        },
      },
      dev: {
        devMiddleware: {
          writeToDisk: false,
        },
      },
    },
  });

  const url = new URL(`http://localhost:${rsbuild.port}/main`);

  await page.goto(url.href);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  await rsbuild.server.close();
});

test('should access /main success when entry is main and set assetPrefix', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: join(fixtures, 'basic'),
    entry: {
      main: join(fixtures, 'basic', 'src/index.ts'),
    },
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist-html-fallback-4',
        },
      },
      dev: {
        devMiddleware: {
          writeToDisk: true,
        },
        assetPrefix: '/aaaa/',
      },
    },
  });

  const url = new URL(`http://localhost:${rsbuild.port}/main`);

  await page.goto(url.href);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  await rsbuild.server.close();
});

test('should access /main success when entry is main and outputPath is /main/index.html', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: join(fixtures, 'basic'),
    entry: {
      main: join(fixtures, 'basic', 'src/index.ts'),
    },
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist-html-fallback-5',
        },
      },
      html: {
        outputStructure: 'nested',
      },
      dev: {
        devMiddleware: {
          writeToDisk: true,
        },
      },
    },
  });

  const url = new URL(`http://localhost:${rsbuild.port}/main`);

  await page.goto(url.href);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  await rsbuild.server.close();
});

test('should return 404 when page is not found', async ({ page }) => {
  const rsbuild = await dev({
    cwd: join(fixtures, 'basic'),
    entry: {
      main: join(fixtures, 'basic', 'src/index.ts'),
    },
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist-html-fallback-6',
        },
      },
      dev: {
        devMiddleware: {
          writeToDisk: true,
        },
      },
    },
  });

  const url = new URL(`http://localhost:${rsbuild.port}/main1`);

  const res = await page.goto(url.href);

  expect(res?.status()).toBe(404);

  await rsbuild.server.close();
});

test('should access /html/main success when entry is main and outputPath is /html/main.html', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: join(fixtures, 'basic'),
    entry: {
      main: join(fixtures, 'basic', 'src/index.ts'),
    },
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist-html-fallback-5',
          html: 'html',
        },
      },
      dev: {
        devMiddleware: {
          writeToDisk: true,
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

  await rsbuild.server.close();
});
