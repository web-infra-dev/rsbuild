import fs from 'node:fs';
import { join } from 'node:path';
import { dev, expectPoll, proxyConsole, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const cwd = __dirname;

rspackOnlyTest(
  'HMR should work after fixing compilation error',
  async ({ page }) => {
    if (process.platform === 'win32') {
      test.skip();
    }

    await fs.promises.cp(join(cwd, 'src'), join(cwd, 'test-temp-src'), {
      recursive: true,
    });

    const { logs, restore } = proxyConsole();

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
        .replace(
          '<div id="test">Hello Rsbuild!</div>',
          '<div id="test">Hello Rsbuild!</div',
        ),
    );

    await expectPoll(() =>
      logs.some((log) => log.includes('Module build failed')),
    ).toBeTruthy();

    await fs.promises.writeFile(
      appPath,
      fs
        .readFileSync(appPath, 'utf-8')
        .replace(
          '<div id="test">Hello Rsbuild!</div',
          '<div id="test">Hello Rsbuild2!</div>',
        ),
    );

    await expect(locator).toHaveText('Hello Rsbuild2!');
    await rsbuild.close();

    restore();
  },
);
