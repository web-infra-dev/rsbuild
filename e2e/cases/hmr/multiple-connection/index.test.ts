import fs from 'node:fs';
import { join } from 'node:path';
import { dev, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const cwd = __dirname;

rspackOnlyTest(
  'should allow to create multiple HMR connections',
  async ({ page: page1, context }) => {
    // HMR cases will fail on Windows
    if (process.platform === 'win32') {
      test.skip();
    }

    await fs.promises.cp(join(cwd, 'src'), join(cwd, 'test-temp-src'), {
      recursive: true,
    });

    const rsbuild = await dev({
      cwd,
      rsbuildConfig: {
        source: {
          entry: {
            index: join(cwd, 'test-temp-src/index.ts'),
          },
        },
      },
    });

    const page2 = await context.newPage();
    await gotoPage(page1, rsbuild);
    await gotoPage(page2, rsbuild);

    const locator1 = page1.locator('#test');
    const locator2 = page2.locator('#test');

    await expect(locator1).toHaveText('Hello Rsbuild!');
    await expect(locator2).toHaveText('Hello Rsbuild!');

    const locatorKeep1 = page1.locator('#test-keep');
    const locatorKeep2 = page2.locator('#test-keep');
    const keepNum1 = await locatorKeep1.innerHTML();
    const keepNum2 = await locatorKeep2.innerHTML();

    const appPath = join(cwd, 'test-temp-src/App.tsx');
    await fs.promises.writeFile(
      appPath,
      fs.readFileSync(appPath, 'utf-8').replace('Hello Rsbuild', 'Hello Test'),
    );

    await expect(locator1).toHaveText('Hello Test!');
    await expect(locator2).toHaveText('Hello Test!');

    // #test-keep should remain unchanged when app.tsx HMR
    await expect(locatorKeep1.innerHTML()).resolves.toBe(keepNum1);
    await expect(locatorKeep2.innerHTML()).resolves.toBe(keepNum2);

    await rsbuild.close();
  },
);
