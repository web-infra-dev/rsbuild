import { join } from 'path';
import { fse } from '@rsbuild/shared';
import { expect, test } from '@playwright/test';
import { rspackOnlyTest } from '@scripts/helper';
import { dev, getHrefByEntryName } from '@scripts/shared';
import { pluginReact } from '@rsbuild/plugin-react';

const fixtures = __dirname;

// hmr test will timeout in CI
rspackOnlyTest('default & hmr (default true)', async ({ page }) => {
  // HMR cases will fail in Windows
  if (process.platform === 'win32') {
    test.skip();
  }

  await fse.copy(join(fixtures, 'hmr/src'), join(fixtures, 'hmr/test-src'));
  const rsbuild = await dev({
    cwd: join(fixtures, 'hmr'),
    plugins: [pluginReact()],
    rsbuildConfig: {
      source: {
        entry: {
          index: join(fixtures, 'hmr', 'test-src/index.ts'),
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

  await page.goto(getHrefByEntryName('index', rsbuild.port));

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');
  await expect(locator).toHaveCSS('color', 'rgb(255, 0, 0)');

  const locatorKeep = page.locator('#test-keep');
  const keepNum = await locatorKeep.innerHTML();

  const appPath = join(fixtures, 'hmr', 'test-src/App.tsx');

  await fse.writeFile(
    appPath,
    fse.readFileSync(appPath, 'utf-8').replace('Hello Rsbuild', 'Hello Test'),
  );

  // wait for hmr take effect
  await new Promise((resolve) => setTimeout(resolve, 2000));

  await expect(locator).toHaveText('Hello Test!');

  // #test-keep should unchanged when app.tsx hmr
  await expect(locatorKeep.innerHTML()).resolves.toBe(keepNum);

  const cssPath = join(fixtures, 'hmr', 'test-src/App.css');

  await fse.writeFile(
    cssPath,
    `#test {
  color: rgb(0, 0, 255);
}`,
  );

  // wait for hmr take effect
  await new Promise((resolve) => setTimeout(resolve, 2000));

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

  await rsbuild.server.close();
});

test('dev.port & output.distPath', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const rsbuild = await dev({
    cwd: join(fixtures, 'basic'),
    plugins: [pluginReact()],
    rsbuildConfig: {
      dev: {
        writeToDisk: true,
      },
      server: {
        port: 3000,
      },
      output: {
        distPath: {
          root: 'dist-1',
          js: 'aa/js',
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('index', rsbuild.port));

  expect(rsbuild.port).toBe(3000);

  expect(
    fse.existsSync(join(fixtures, 'basic/dist-1/index.html')),
  ).toBeTruthy();

  expect(fse.existsSync(join(fixtures, 'basic/dist-1/aa/js'))).toBeTruthy();

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  await rsbuild.server.close();

  expect(errors).toEqual([]);

  await fse.remove(join(fixtures, 'basic/dist-1'));
});

rspackOnlyTest(
  'hmr should work when setting dev.port & client',
  async ({ page }) => {
    // HMR cases will fail in Windows
    if (process.platform === 'win32') {
      test.skip();
    }

    await fse.copy(join(fixtures, 'hmr/src'), join(fixtures, 'hmr/test-src-1'));
    const cwd = join(fixtures, 'hmr');
    const rsbuild = await dev({
      cwd,
      plugins: [pluginReact()],
      rsbuildConfig: {
        source: {
          entry: {
            index: join(cwd, 'test-src-1/index.ts'),
          },
        },
        output: {
          distPath: {
            root: 'dist-hmr-1',
          },
        },
        server: {
          port: 3001,
        },
        dev: {
          client: {
            host: '',
          },
        },
      },
    });

    await page.goto(getHrefByEntryName('index', rsbuild.port));
    expect(rsbuild.port).toBe(3001);

    const appPath = join(fixtures, 'hmr', 'test-src-1/App.tsx');

    const locator = page.locator('#test');
    await expect(locator).toHaveText('Hello Rsbuild!');

    await fse.writeFile(
      appPath,
      fse.readFileSync(appPath, 'utf-8').replace('Hello Rsbuild', 'Hello Test'),
    );

    // wait for hmr take effect
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await expect(locator).toHaveText('Hello Test!');

    // restore
    await fse.writeFile(
      appPath,
      fse.readFileSync(appPath, 'utf-8').replace('Hello Test', 'Hello Rsbuild'),
    );

    await rsbuild.server.close();
  },
);

// need devcert
// TODO: failed in Windows
test.skip('dev.https', async () => {
  const rsbuild = await dev({
    cwd: join(fixtures, 'basic'),
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist-https',
        },
      },
      server: {
        https: true,
      },
    },
  });

  expect(rsbuild.urls[0].startsWith('https')).toBeTruthy();

  await rsbuild.server.close();
});

// hmr will timeout in CI
test('devServer', async ({ page }) => {
  // HMR cases will fail in Windows
  if (process.platform === 'win32') {
    test.skip();
  }

  let i = 0;
  let reloadFn: undefined | (() => void);

  // Only tested to see if it works, not all configurations.
  const rsbuild = await dev({
    cwd: join(fixtures, 'basic'),
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist-dev-server',
        },
      },
      dev: {
        setupMiddlewares: [
          (middlewares, server) => {
            middlewares.unshift((req, res, next) => {
              i++;
              next();
            });
            reloadFn = () => server.sockWrite('content-changed');
          },
        ],
      },
    },
  });

  await page.goto(getHrefByEntryName('index', rsbuild.port));

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  expect(i).toBeGreaterThanOrEqual(1);
  expect(reloadFn).toBeDefined();

  i = 0;
  reloadFn!();

  // wait for page reload take effect
  await new Promise((resolve) => setTimeout(resolve, 2000));

  expect(i).toBeGreaterThanOrEqual(1);

  await rsbuild.server.close();
});
