import fs from 'node:fs';
import path from 'node:path';
import { dev, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const appFile = path.join(__dirname, 'src/App.jsx');
let appCode: string;

test.beforeEach(() => {
  appCode = fs.readFileSync(appFile, 'utf-8');
});

test.afterEach(() => {
  // recover the source code
  fs.writeFileSync(appFile, appCode, 'utf-8');
});

rspackOnlyTest(
  'should fallback to live-reload when dev.hmr is false',
  async ({ page }) => {
    // HMR cases will fail on Windows
    if (process.platform === 'win32') {
      test.skip();
    }

    const rsbuild = await dev({
      cwd: __dirname,
      page,
    });

    const testEl = page.locator('#test');
    await expect(testEl).toHaveText('Hello Rsbuild!');

    fs.writeFileSync(
      appFile,
      appCode.replace('Rsbuild', 'Live Reload'),
      'utf-8',
    );
    await expect(testEl).toHaveText('Hello Live Reload!');

    await rsbuild.close();
  },
);

rspackOnlyTest(
  'should not reload page when live-reload is disabled',
  async ({ page }) => {
    const rsbuild = await dev({
      cwd: __dirname,
      page,
      rsbuildConfig: {
        dev: {
          liveReload: false,
          // in this test, we disable hmr and liveReload,
          // but lazyCompilation dependent hmr or liveReload to load lazy js bundle
          lazyCompilation: false,
        },
      },
    });

    const test = page.locator('#test');
    await expect(test).toHaveText('Hello Rsbuild!');

    fs.writeFileSync(
      appFile,
      appCode.replace('Rsbuild', 'Live Reload'),
      'utf-8',
    );
    await expect(test).toHaveText('Hello Rsbuild!');

    await rsbuild.close();
  },
);
