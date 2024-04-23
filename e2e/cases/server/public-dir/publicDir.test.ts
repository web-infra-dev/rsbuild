import path, { join } from 'node:path';
import { build, dev, gotoPage } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { fse } from '@rsbuild/shared';

const cwd = __dirname;

test('should serve publicDir for dev server correctly', async ({ page }) => {
  await fse.outputFile(join(__dirname, 'public', 'test-temp-file.txt'), 'aaaa');

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

  const res = await page.goto(
    `http://localhost:${rsbuild.port}/test-temp-file.txt`,
  );

  expect((await res?.body())?.toString().trim()).toBe('aaaa');

  await rsbuild.close();
});

test('should serve custom publicDir for dev server correctly', async ({
  page,
}) => {
  await fse.outputFile(
    join(__dirname, 'public1', 'test-temp-file.txt'),
    'aaaa111',
  );

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

  const res = await page.goto(
    `http://localhost:${rsbuild.port}/test-temp-file.txt`,
  );

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

  const res = await page.goto(
    `http://localhost:${rsbuild.port}/test-temp-file.txt`,
  );

  expect(res?.status()).toBe(404);

  await rsbuild.close();
});

test('should serve publicDir for preview server correctly', async ({
  page,
}) => {
  await fse.outputFile(join(__dirname, 'public', 'test-temp-file.txt'), 'aaaa');

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

  const res = await page.goto(
    `http://localhost:${rsbuild.port}/test-temp-file.txt`,
  );

  expect((await res?.body())?.toString().trim()).toBe('aaaa');

  await rsbuild.close();
});

test('should reload page when publicDir file changes', async ({ page }) => {
  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
      server: {
        publicDir: {
          watch: true,
        },
      },
    },
  });

  await gotoPage(page, rsbuild);

  const file = path.join(__dirname, '/public/test-temp-file.txt');

  await fse.outputFile(file, 'test');
  // check the page is reloaded
  await new Promise((resolve) => {
    page.waitForURL(page.url()).then(resolve);
  });

  // reset file
  await fse.outputFile(file, 'aaaa');
  await rsbuild.close();
});

test('should reload page when custom publicDir file changes', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
      server: {
        publicDir: {
          name: 'public1',
          watch: true,
        },
      },
    },
  });

  await gotoPage(page, rsbuild);

  const file = path.join(__dirname, '/public1/test-temp-file.txt');

  await fse.outputFile(file, 'test');
  // check the page is reloaded
  await new Promise((resolve) => {
    page.waitForURL(page.url()).then(resolve);
  });

  // reset file
  await fse.outputFile(file, 'aaaa111');
  await rsbuild.close();
});
