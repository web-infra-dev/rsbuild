import fs from 'node:fs';
import { join } from 'node:path';
import { dev, expectPoll, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const cwd = __dirname;

rspackOnlyTest('should print changed files in logs', async ({ page }) => {
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
    },
  });

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  const appPath = join(cwd, 'test-temp-src/App.tsx');

  await fs.promises.writeFile(
    appPath,
    fs
      .readFileSync(appPath, 'utf-8')
      .replace('Hello Rsbuild!', 'Hello Rsbuild2!'),
  );

  await expectPoll(() =>
    rsbuild.logs.some((log) => log.includes('building test-temp-src/App.tsx')),
  ).toBeTruthy();

  await rsbuild.close();
});

rspackOnlyTest('should print removed files in logs', async ({ page }) => {
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
    },
  });

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  const appPath = join(cwd, 'test-temp-src/App.tsx');

  await fs.promises.unlink(appPath);

  await expectPoll(() =>
    rsbuild.logs.some((log) =>
      log.includes('building removed test-temp-src/App.tsx'),
    ),
  ).toBeTruthy();

  await rsbuild.close();
});
