import { join } from 'node:path';
import { dev, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginReact } from '@rsbuild/plugin-react';
import { fse } from '@rsbuild/shared';

const fixtures = __dirname;

// hmr test will timeout in CI
rspackOnlyTest('default & hmr (default true)', async ({ page }) => {
  // HMR cases will fail in Windows
  if (process.platform === 'win32') {
    test.skip();
  }

  await fse.copy(
    join(fixtures, 'hmr/src'),
    join(fixtures, 'hmr/test-temp-src'),
  );
  const rsbuild = await dev({
    cwd: join(fixtures, 'hmr'),
    plugins: [pluginReact()],
    rsbuildConfig: {
      source: {
        entry: {
          index: join(fixtures, 'hmr', 'test-temp-src/index.ts'),
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

  const appPath = join(fixtures, 'hmr', 'test-temp-src/App.tsx');

  await fse.writeFile(
    appPath,
    fse.readFileSync(appPath, 'utf-8').replace('Hello Rsbuild', 'Hello Test'),
  );

  await expect(locator).toHaveText('Hello Test!');

  // #test-keep should unchanged when app.tsx hmr
  await expect(locatorKeep.innerHTML()).resolves.toBe(keepNum);

  const cssPath = join(fixtures, 'hmr', 'test-temp-src/App.css');

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

    await fse.copy(
      join(fixtures, 'hmr/src'),
      join(fixtures, 'hmr/test-temp-src-1'),
    );
    const cwd = join(fixtures, 'hmr');
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
          port: 3001,
        },
        dev: {
          client: {
            host: '',
          },
        },
      },
    });

    await gotoPage(page, rsbuild);
    expect(rsbuild.port).toBe(3001);

    const appPath = join(fixtures, 'hmr', 'test-temp-src-1/App.tsx');

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

  await gotoPage(page, rsbuild);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  expect(i).toBeGreaterThanOrEqual(1);
  expect(reloadFn).toBeDefined();

  i = 0;
  reloadFn!();

  // check value of `i`
  const maxChecks = 100;
  let checks = 0;
  while (checks < maxChecks) {
    if (i === 0) {
      checks++;
      await new Promise((resolve) => setTimeout(resolve, 50));
    } else {
      break;
    }
  }

  expect(i).toBeGreaterThanOrEqual(1);

  await rsbuild.close();
});
