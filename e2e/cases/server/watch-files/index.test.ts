import fs from 'node:fs';
import path from 'node:path';
import { dev, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest('should work with string and path to file', async ({ page }) => {
  const file = path.join(import.meta.dirname, '/assets/example.txt');
  const rsbuild = await dev({
    cwd: import.meta.dirname,
    page,
    rsbuildConfig: {
      dev: {
        watchFiles: {
          paths: file,
        },
      },
    },
  });

  await fs.promises.writeFile(file, 'test');
  // check the page is reloaded
  await new Promise((resolve) => {
    page.waitForURL(page.url()).then(resolve);
  });

  // reset file
  fs.truncateSync(file);
  await rsbuild.close();
});

rspackOnlyTest(
  'should work with string and path to directory',
  async ({ page }) => {
    const file = path.join(import.meta.dirname, '/assets/example.txt');
    const rsbuild = await dev({
      cwd: import.meta.dirname,
      page,
      rsbuildConfig: {
        dev: {
          watchFiles: {
            paths: path.join(import.meta.dirname, '/assets'),
          },
        },
      },
    });

    await fs.promises.writeFile(file, 'test');

    await new Promise((resolve) => {
      page.waitForURL(page.url()).then(resolve);
    });

    // reset file
    fs.truncateSync(file);
    await rsbuild.close();
  },
);

rspackOnlyTest('should work with string array directory', async ({ page }) => {
  const file = path.join(import.meta.dirname, '/assets/example.txt');
  const other = path.join(import.meta.dirname, '/other/other.txt');
  const rsbuild = await dev({
    cwd: import.meta.dirname,
    page,
    rsbuildConfig: {
      dev: {
        watchFiles: {
          paths: [
            path.join(import.meta.dirname, '/assets'),
            path.join(import.meta.dirname, '/other'),
          ],
        },
      },
    },
  });

  await fs.promises.writeFile(file, 'test');
  // check the page is reloaded
  await new Promise((resolve) => {
    page.waitForURL(page.url()).then(resolve);
  });
  // reset file
  fs.truncateSync(file);

  await fs.promises.writeFile(other, 'test');
  // check the page is reloaded
  await new Promise((resolve) => {
    page.waitForURL(page.url()).then(resolve);
  });
  // reset file
  fs.truncateSync(other);

  await rsbuild.close();
});

rspackOnlyTest('should work with string and glob', async ({ page }) => {
  const file = path.join(import.meta.dirname, '/assets/example.txt');
  const watchDir = path.join(import.meta.dirname, '/assets');
  const rsbuild = await dev({
    cwd: import.meta.dirname,
    page,
    rsbuildConfig: {
      dev: {
        watchFiles: {
          paths: `${watchDir}/**/*`,
        },
      },
    },
  });

  await fs.promises.writeFile(file, 'test');
  // check the page is reloaded
  await new Promise((resolve) => {
    page.waitForURL(page.url()).then(resolve);
  });

  // reset file
  fs.truncateSync(file);
  await rsbuild.close();
});

rspackOnlyTest('should work with options', async ({ page }) => {
  const file = path.join(import.meta.dirname, '/assets/example.txt');
  const rsbuild = await dev({
    cwd: import.meta.dirname,
    page,
    rsbuildConfig: {
      dev: {
        watchFiles: {
          paths: file,
          options: {
            usePolling: true,
          },
        },
      },
    },
  });

  await fs.promises.writeFile(file, 'test');
  // check the page is reloaded
  await new Promise((resolve) => {
    page.waitForURL(page.url()).then(resolve);
  });

  // reset file
  fs.truncateSync(file);
  await rsbuild.close();
});
