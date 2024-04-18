import { dev, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { fse } from '@rsbuild/shared';
import path from 'node:path';

rspackOnlyTest('should work with string and path to file', async ({ page }) => {
  const file = path.join(__dirname, '/assets/example.txt');
  const rsbuild = await dev({
    cwd: __dirname,
    rsbuildConfig: {
      dev: {
        watchFiles: file,
      },
    },
  });
  await gotoPage(page, rsbuild);

  await fse.writeFile(file, 'test');
  // check the page is reloaded
  await page.waitForResponse((response) => response.url() === page.url());

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
          watchFiles: path.join(__dirname, '/assets'),
        },
      },
    });
    await gotoPage(page, rsbuild);

    await fse.writeFile(file, 'test');
    // check the page is reloaded
    await page.waitForResponse((response) => response.url() === page.url());

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
        watchFiles: [
          path.join(__dirname, '/assets'),
          path.join(__dirname, '/other'),
        ],
      },
    },
  });
  await gotoPage(page, rsbuild);

  await fse.writeFile(file, 'test');
  // check the page is reloaded
  await page.waitForResponse((response) => response.url() === page.url());
  // reset file
  fse.truncateSync(file);

  await fse.writeFile(other, 'test');
  // check the page is reloaded
  await page.waitForResponse((response) => response.url() === page.url());
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
        watchFiles: `${watchDir}/**/*`,
      },
    },
  });
  await gotoPage(page, rsbuild);

  await fse.writeFile(file, 'test');
  // check the page is reloaded
  await page.waitForResponse((response) => response.url() === page.url());

  // reset file
  fse.truncateSync(file);
  await rsbuild.close();
});

rspackOnlyTest('should work with object with single path', async ({ page }) => {
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
  await page.waitForResponse((response) => response.url() === page.url());

  // reset file
  fse.truncateSync(file);
  await rsbuild.close();
});

rspackOnlyTest(
  'should work with object with multiple paths',
  async ({ page }) => {
    const file = path.join(__dirname, '/assets/example.txt');
    const other = path.join(__dirname, '/other/other.txt');
    const rsbuild = await dev({
      cwd: __dirname,
      rsbuildConfig: {
        dev: {
          watchFiles: { paths: [file, other] },
        },
      },
    });
    await gotoPage(page, rsbuild);

    await fse.writeFile(file, 'test');
    // check the page is reloaded
    await page.waitForResponse((response) => response.url() === page.url());
    // reset file
    fse.truncateSync(file);

    await fse.writeFile(other, 'test');
    // check the page is reloaded
    await page.waitForResponse((response) => response.url() === page.url());
    // reset file
    fse.truncateSync(other);

    await rsbuild.close();
  },
);

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
  await page.waitForResponse((response) => response.url() === page.url());

  // reset file
  fse.truncateSync(file);
  await rsbuild.close();
});
