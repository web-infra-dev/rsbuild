import fs from 'node:fs';
import { join } from 'node:path';
import { dev, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const cwd = __dirname;

rspackOnlyTest(
  'HMR should work when Fast Refresh is disabled',
  async ({ page }) => {
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
      },
    });

    const locator = page.locator('#test');
    await expect(locator).toHaveText('Hello Rsbuild!');
    await expect(locator).toHaveCSS('color', 'rgb(255, 0, 0)');

    const appPath = join(cwd, 'test-temp-src/App.tsx');
    await fs.promises.writeFile(
      appPath,
      fs.readFileSync(appPath, 'utf-8').replace('Hello Rsbuild', 'Hello Test'),
    );
    await expect(locator).toHaveText('Hello Test!');
    await rsbuild.close();
  },
);
