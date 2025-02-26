import fs from 'node:fs';
import { join } from 'node:path';
import { dev, getRandomPort, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const cwd = __dirname;

rspackOnlyTest('HMR should work by default', async ({ page }) => {
  // HMR cases will fail in Windows
  if (process.platform === 'win32') {
    test.skip();
  }

  await fs.promises.cp(join(cwd, 'src'), join(cwd, 'test-temp-src'), {
    recursive: true,
  });

  const rsbuild = await dev({
    cwd,
    page,
    rsbuildConfig: {
      source: {
        entry: {
          index: join(cwd, 'test-temp-src/index.ts'),
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

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');
  await expect(locator).toHaveCSS('color', 'rgb(255, 0, 0)');

  const locatorKeep = page.locator('#test-keep');
  const keepNum = await locatorKeep.innerHTML();

  const appPath = join(cwd, 'test-temp-src/App.tsx');

  await fs.promises.writeFile(
    appPath,
    fs.readFileSync(appPath, 'utf-8').replace('Hello Rsbuild', 'Hello Test'),
  );

  await expect(locator).toHaveText('Hello Test!');

  // #test-keep should unchanged when app.tsx HMR
  await expect(locatorKeep.innerHTML()).resolves.toBe(keepNum);

  const cssPath = join(cwd, 'test-temp-src/App.css');

  await fs.promises.writeFile(
    cssPath,
    `#test {
  color: rgb(0, 0, 255);
}`,
  );

  await expect(locator).toHaveCSS('color', 'rgb(0, 0, 255)');
  await rsbuild.close();
});

rspackOnlyTest(
  'HMR should work when setting dev.port & client',
  async ({ page }) => {
    // HMR cases will fail in Windows
    if (process.platform === 'win32') {
      test.skip();
    }

    await fs.promises.cp(join(cwd, 'src'), join(cwd, 'test-temp-src-1'), {
      recursive: true,
    });

    const port = await getRandomPort();
    const rsbuild = await dev({
      cwd,
      page,
      rsbuildConfig: {
        source: {
          entry: {
            index: join(cwd, 'test-temp-src-1/index.ts'),
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

    expect(rsbuild.port).toBe(port);

    const appPath = join(cwd, 'test-temp-src-1/App.tsx');

    const locator = page.locator('#test');
    await expect(locator).toHaveText('Hello Rsbuild!');

    await fs.promises.writeFile(
      appPath,
      fs.readFileSync(appPath, 'utf-8').replace('Hello Rsbuild', 'Hello Test'),
    );

    await expect(locator).toHaveText('Hello Test!');
    await rsbuild.close();
  },
);

rspackOnlyTest(
  'HMR should work when dev.port is `<port>`',
  async ({ page }) => {
    // HMR cases will fail in Windows
    if (process.platform === 'win32') {
      test.skip();
    }

    await fs.promises.cp(join(cwd, 'src'), join(cwd, 'test-temp-src-2'), {
      recursive: true,
    });

    const port = await getRandomPort();
    const rsbuild = await dev({
      cwd,
      page,
      rsbuildConfig: {
        source: {
          entry: {
            index: join(cwd, 'test-temp-src-2/index.ts'),
          },
        },
        server: {
          port,
        },
        dev: {
          client: {
            port: '<port>',
          },
        },
      },
    });

    expect(rsbuild.port).toBe(port);

    const appPath = join(cwd, 'test-temp-src-2/App.tsx');

    const locator = page.locator('#test');
    await expect(locator).toHaveText('Hello Rsbuild!');

    await fs.promises.writeFile(
      appPath,
      fs.readFileSync(appPath, 'utf-8').replace('Hello Rsbuild', 'Hello Test'),
    );

    await expect(locator).toHaveText('Hello Test!');
    await rsbuild.close();
  },
);
