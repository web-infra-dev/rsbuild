import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { dev, build } from '@e2e/helper';

const cwd = __dirname;

test('should serve publicDir for dev server correctly', async ({ page }) => {
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
          root: 'dist-dev-1',
        },
      },
    },
  });

  const res = await page.goto(`http://localhost:${rsbuild.port}/aa.txt`);

  expect((await res?.body())?.toString().trim()).toBe('aaaa');

  await rsbuild.close();
});

test('should serve custom publicDir for dev server correctly', async ({
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
      server: {
        publicDir: {
          name: 'public1',
        },
      },
      output: {
        distPath: {
          root: 'dist-dev-1',
        },
      },
    },
  });

  const res = await page.goto(`http://localhost:${rsbuild.port}/aa.txt`);

  expect((await res?.body())?.toString().trim()).toBe('aaaa111');

  await rsbuild.close();
});

test('should not serve publicDir when publicDir is false', async ({ page }) => {
  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
      source: {
        entry: {
          main: join(cwd, 'src/index.js'),
        },
      },
      server: {
        publicDir: false,
        htmlFallback: false,
      },
      output: {
        distPath: {
          root: 'dist-dev-1',
        },
      },
    },
  });

  const res = await page.goto(`http://localhost:${rsbuild.port}/aa.txt`);

  expect(res?.status()).toBe(404);

  await rsbuild.close();
});

test('should serve publicDir for preview server correctly', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd,
    runServer: true,
    rsbuildConfig: {
      source: {
        entry: {
          main: join(cwd, 'src/index.js'),
        },
      },
      output: {
        distPath: {
          root: 'dist-build-1',
        },
      },
    },
  });

  const res = await page.goto(`http://localhost:${rsbuild.port}/aa.txt`);

  expect((await res?.body())?.toString().trim()).toBe('aaaa');

  await rsbuild.close();
});
