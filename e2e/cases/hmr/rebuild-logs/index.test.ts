import fs from 'node:fs';
import { join } from 'node:path';
import { expect, rspackOnlyTest } from '@e2e/helper';

const cwd = __dirname;

rspackOnlyTest('should print changed files in logs', async ({ page, dev }) => {
  await fs.promises.cp(join(cwd, 'src'), join(cwd, 'test-temp-src'), {
    recursive: true,
  });

  const rsbuild = await dev({
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

  await rsbuild.expectLog(/building test-temp-src[\\/]App\.tsx/);
});

rspackOnlyTest('should print removed files in logs', async ({ page, dev }) => {
  await fs.promises.cp(join(cwd, 'src'), join(cwd, 'test-temp-src'), {
    recursive: true,
  });

  const rsbuild = await dev({
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

  await rsbuild.expectLog(/building removed test-temp-src[\\/]App\.tsx/);
});
