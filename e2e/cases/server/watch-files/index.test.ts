import fs from 'node:fs';
import path from 'node:path';
import { dev, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest('should work with string and path to file', async ({ page }) => {
  const file = path.join(__dirname, '/assets/example.txt');
  await dev({
    cwd: __dirname,
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
});

rspackOnlyTest(
  'should work with string and path to directory',
  async ({ page }) => {
    const file = path.join(__dirname, '/assets/example.txt');
    await dev({
      cwd: __dirname,
      page,
      rsbuildConfig: {
        dev: {
          watchFiles: {
            paths: path.join(__dirname, '/assets'),
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
  },
);

rspackOnlyTest('should work with string array directory', async ({ page }) => {
  const file = path.join(__dirname, '/assets/example.txt');
  const other = path.join(__dirname, '/other/other.txt');
  await dev({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      dev: {
        watchFiles: {
          paths: [
            path.join(__dirname, '/assets'),
            path.join(__dirname, '/other'),
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
});

rspackOnlyTest('should work with string and glob', async ({ page }) => {
  const file = path.join(__dirname, '/assets/example.txt');
  const watchDir = path.join(__dirname, '/assets');
  await dev({
    cwd: __dirname,
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
});

rspackOnlyTest('should work with options', async ({ page }) => {
  const file = path.join(__dirname, '/assets/example.txt');
  await dev({
    cwd: __dirname,
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
});
