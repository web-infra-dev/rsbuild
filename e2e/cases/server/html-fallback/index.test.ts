import fs from 'node:fs';
import { join } from 'node:path';
import { dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const cwd = __dirname;

test('should access / success and htmlFallback success by default', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
      dev: {
        writeToDisk: true,
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

  // should fallback to index by default
  const url1 = new URL(`http://localhost:${rsbuild.port}/aaaaa`);

  await page.goto(url1.href);

  await expect(page.locator('#test')).toHaveText('Hello Rsbuild!');

  // compat invalid route and fallback success
  await page.goto(`http://localhost:${rsbuild.port}//aaaaa`);

  await expect(page.locator('#test')).toHaveText('Hello Rsbuild!');

  await rsbuild.close();
});

test('should return 404 when htmlFallback false', async ({ page }) => {
  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
      dev: {
        writeToDisk: true,
      },
      server: {
        htmlFallback: false,
      },
      output: {
        distPath: {
          root: 'dist-html-fallback-0-1',
        },
      },
    },
  });

  const url = new URL(`http://localhost:${rsbuild.port}/aaaaa`);

  const res = await page.goto(url.href);

  expect(res?.status()).toBe(404);

  await rsbuild.close();
});

test('should access /main with query or hash success', async ({ page }) => {
  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
      source: {
        entry: {
          main: join(cwd, 'src/index.js'),
        },
      },
    },
  });

  const url = new URL(`http://localhost:${rsbuild.port}/main?aa=1`);

  const res = await page.goto(url.href);

  expect(res?.status()).toBe(200);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  const url1 = new URL(`http://localhost:${rsbuild.port}/main#aa=1`);

  const res1 = await page.goto(url1.href);

  expect(res1?.status()).toBe(200);

  await rsbuild.close();
});

test('should access /main.html success when entry is main', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
      source: {
        entry: {
          main: join(cwd, 'src/index.js'),
        },
      },
      output: {
        distPath: {
          root: 'dist-html-fallback-1',
        },
      },
      dev: {
        writeToDisk: true,
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
  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
      source: {
        entry: {
          main: join(cwd, 'src/index.js'),
        },
      },
      output: {
        distPath: {
          root: 'dist-html-fallback-2',
        },
      },
      dev: {
        writeToDisk: true,
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

test('should access /main success when entry is main and use memoryFs', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
      source: {
        entry: {
          main: join(cwd, 'src/index.js'),
        },
      },
      output: {
        distPath: {
          root: 'dist-html-fallback-3',
        },
      },
      dev: {
        writeToDisk: true,
      },
    },
  });

  const url = new URL(`http://localhost:${rsbuild.port}/main`);

  await page.goto(url.href);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  await rsbuild.close();
});

test('should access /main success when entry is main and set assetPrefix', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
      source: {
        entry: {
          main: join(cwd, 'src/index.js'),
        },
      },
      output: {
        distPath: {
          root: 'dist-html-fallback-4',
        },
      },
      dev: {
        writeToDisk: true,
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
  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
      source: {
        entry: {
          main: join(cwd, 'src/index.js'),
        },
      },
      output: {
        distPath: {
          root: 'dist-html-fallback-5',
        },
      },
      html: {
        outputStructure: 'nested',
      },
      dev: {
        writeToDisk: true,
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
  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
      source: {
        entry: {
          main: join(cwd, 'src/index.js'),
        },
      },
      output: {
        distPath: {
          root: 'dist-html-fallback-6',
        },
      },
      dev: {
        writeToDisk: true,
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
  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
      source: {
        entry: {
          main: join(cwd, 'src/index.js'),
        },
      },
      output: {
        distPath: {
          root: 'dist-html-fallback-5',
          html: 'html',
        },
      },
      dev: {
        writeToDisk: true,
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

test('should access /main success when modify publicPath in compiler', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
      source: {
        entry: {
          main: join(cwd, 'src/index.js'),
        },
      },
      output: {
        distPath: {
          root: 'dist-html-fallback-6',
        },
      },
      dev: {
        writeToDisk: true,
      },
    },
    plugins: [
      {
        name: 'foo',
        setup(api: any) {
          api.modifyBundlerChain((chain: any) => {
            chain.output.publicPath('/aaaa/');
          });
        },
      },
    ],
  });

  const url = new URL(`http://localhost:${rsbuild.port}/main`);

  await page.goto(url.href);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  const content = fs.readFileSync(
    join(cwd, 'dist-html-fallback-6', 'main.html'),
    'utf-8',
  );

  expect(content.includes('/aaaa/static/js/main.js')).toBeTruthy();

  await rsbuild.close();
});

test('should access /main success when distPath is absolute', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
      source: {
        entry: {
          main: join(cwd, 'src/index.js'),
        },
      },
      output: {
        distPath: {
          root: join(cwd, 'dist-html-fallback-7'),
        },
      },
    },
  });

  // access /main success
  const url = new URL(`http://localhost:${rsbuild.port}/main`);

  await page.goto(url.href);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  await rsbuild.close();
});
