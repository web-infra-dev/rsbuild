import path from 'node:path';
import { dev, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { fse } from '@rsbuild/shared';

rspackOnlyTest('should work with string and path to file', async ({ page }) => {
  const file = path.join(__dirname, '/assets/example.txt');
  const rsbuild = await dev({
    cwd: __dirname,
    rsbuildConfig: {
      dev: {
        watchFiles: {
          paths: file,
        },
      },
    },
  });
  await gotoPage(page, rsbuild);

  await fse.writeFile(file, 'test');
  // check the page is reloaded
  await new Promise((resolve) => {
    page.waitForURL(page.url()).then(resolve);
  });

  // reset file
  fse.truncateSync(file);
  await rsbuild.close();
});

rspackOnlyTest(
  'should work with string and path to directory',
  async ({ page }) => {
    const file = path.join(__dirname, '/assets/example.txt');
    const rsbuild = await dev({
      cwd: __dirname,
      rsbuildConfig: {
        dev: {
          watchFiles: {
            paths: path.join(__dirname, '/assets'),
          },
        },
      },
    });
    await gotoPage(page, rsbuild);

    await fse.writeFile(file, 'test');

    await new Promise((resolve) => {
      page.waitForURL(page.url()).then(resolve);
    });

    // reset file
    fse.truncateSync(file);
    await rsbuild.close();
  },
);

rspackOnlyTest('should work with string array directory', async ({ page }) => {
  const file = path.join(__dirname, '/assets/example.txt');
  const other = path.join(__dirname, '/other/other.txt');
  const rsbuild = await dev({
    cwd: __dirname,
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
  await gotoPage(page, rsbuild);

  await fse.writeFile(file, 'test');
  // check the page is reloaded
  await new Promise((resolve) => {
    page.waitForURL(page.url()).then(resolve);
  });
  // reset file
  fse.truncateSync(file);

  await fse.writeFile(other, 'test');
  // check the page is reloaded
  await new Promise((resolve) => {
    page.waitForURL(page.url()).then(resolve);
  });
  // reset file
  fse.truncateSync(other);

  await rsbuild.close();
});

rspackOnlyTest('should work with string and glob', async ({ page }) => {
  const file = path.join(__dirname, '/assets/example.txt');
  const watchDir = path.join(__dirname, '/assets');
  const rsbuild = await dev({
    cwd: __dirname,
    rsbuildConfig: {
      dev: {
        watchFiles: {
          paths: `${watchDir}/**/*`,
        },
      },
    },
  });
  await gotoPage(page, rsbuild);

  await fse.writeFile(file, 'test');
  // check the page is reloaded
  await new Promise((resolve) => {
    page.waitForURL(page.url()).then(resolve);
  });

  // reset file
  fse.truncateSync(file);
  await rsbuild.close();
});

rspackOnlyTest('should work with options', async ({ page }) => {
  const file = path.join(__dirname, '/assets/example.txt');
  const rsbuild = await dev({
    cwd: __dirname,
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
  await gotoPage(page, rsbuild);

  await fse.writeFile(file, 'test');
  // check the page is reloaded
  await new Promise((resolve) => {
    page.waitForURL(page.url()).then(resolve);
  });

  // reset file
  fse.truncateSync(file);
  await rsbuild.close();
});
