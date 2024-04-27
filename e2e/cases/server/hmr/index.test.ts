import { join } from 'node:path';
import { dev, getRandomPort, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginReact } from '@rsbuild/plugin-react';
import { fse } from '@rsbuild/shared';

const cwd = __dirname;

// hmr test will timeout in CI
rspackOnlyTest('default & hmr (default true)', async ({ page }) => {
  // HMR cases will fail in Windows
  if (process.platform === 'win32') {
    test.skip();
  }

  await fse.copy(join(cwd, 'src'), join(cwd, 'test-temp-src'));

  const rsbuild = await dev({
    cwd,
    plugins: [pluginReact()],
    rsbuildConfig: {
      source: {
        entry: {
          index: join(cwd, 'test-temp-src/index.ts'),
        },
      },
      output: {
        distPath: {
          root: 'dist-hmr',
        },
      },
      dev: {
        client: {
          host: '',
          port: '',
        },
      },
    },
  });

  await gotoPage(page, rsbuild);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');
  await expect(locator).toHaveCSS('color', 'rgb(255, 0, 0)');

  const locatorKeep = page.locator('#test-keep');
  const keepNum = await locatorKeep.innerHTML();

  const appPath = join(cwd, 'test-temp-src/App.tsx');

  await fse.writeFile(
    appPath,
    fse.readFileSync(appPath, 'utf-8').replace('Hello Rsbuild', 'Hello Test'),
  );

  await expect(locator).toHaveText('Hello Test!');

  // #test-keep should unchanged when app.tsx hmr
  await expect(locatorKeep.innerHTML()).resolves.toBe(keepNum);

  const cssPath = join(cwd, 'test-temp-src/App.css');

  await fse.writeFile(
    cssPath,
    `#test {
  color: rgb(0, 0, 255);
}`,
  );

  await expect(locator).toHaveCSS('color', 'rgb(0, 0, 255)');

  // restore
  await fse.writeFile(
    appPath,
    fse.readFileSync(appPath, 'utf-8').replace('Hello Test', 'Hello Rsbuild'),
  );

  await fse.writeFile(
    cssPath,
    `#test {
  color: rgb(255, 0, 0);
}`,
  );

  await rsbuild.close();
});

rspackOnlyTest(
  'hmr should work when setting dev.port & client',
  async ({ page }) => {
    // HMR cases will fail in Windows
    if (process.platform === 'win32') {
      test.skip();
    }

    await fse.copy(join(cwd, 'src'), join(cwd, 'test-temp-src-1'));

    const port = await getRandomPort();
    const rsbuild = await dev({
      cwd,
      plugins: [pluginReact()],
      rsbuildConfig: {
        source: {
          entry: {
            index: join(cwd, 'test-temp-src-1/index.ts'),
          },
        },
        output: {
          distPath: {
            root: 'dist-hmr-1',
          },
        },
        server: {
          port,
        },
        dev: {
          client: {
            host: '',
          },
        },
      },
    });

    await gotoPage(page, rsbuild);
    expect(rsbuild.port).toBe(port);

    const appPath = join(cwd, 'test-temp-src-1/App.tsx');

    const locator = page.locator('#test');
    await expect(locator).toHaveText('Hello Rsbuild!');

    await fse.writeFile(
      appPath,
      fse.readFileSync(appPath, 'utf-8').replace('Hello Rsbuild', 'Hello Test'),
    );

    await expect(locator).toHaveText('Hello Test!');

    // restore
    await fse.writeFile(
      appPath,
      fse.readFileSync(appPath, 'utf-8').replace('Hello Test', 'Hello Rsbuild'),
    );

    await rsbuild.close();
  },
);
