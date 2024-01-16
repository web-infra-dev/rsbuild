import path from 'path';
import fs from 'fs';
import { test, expect } from '@playwright/test';
import { dev, gotoPage } from '@scripts/shared';

const appFile = path.join(__dirname, 'src/App.jsx');
let appCode: string;

test.beforeEach(() => {
  appCode = fs.readFileSync(appFile, 'utf-8');
});

test.afterEach(() => {
  // recover the source code
  fs.writeFileSync(appFile, appCode, 'utf-8');
});

test('should fallback to live-reload when dev.hmr is false', async ({
  page,
}) => {
  // HMR cases will fail in Windows
  if (process.platform === 'win32') {
    test.skip();
  }

  const rsbuild = await dev({
    cwd: __dirname,
  });

  await gotoPage(page, rsbuild);

  const testEl = page.locator('#test');
  await expect(testEl).toHaveText('Hello Rsbuild!');

  fs.writeFileSync(appFile, appCode.replace('Rsbuild', 'Live Reload'), 'utf-8');
  await expect(testEl).toHaveText('Hello Live Reload!');

  rsbuild.server.close();
});

test('should not reload page when live-reload is disabled', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
    rsbuildConfig: {
      dev: {
        liveReload: false,
      },
    },
  });

  await gotoPage(page, rsbuild);

  const test = page.locator('#test');
  await expect(test).toHaveText('Hello Rsbuild!');

  fs.writeFileSync(appFile, appCode.replace('Rsbuild', 'Live Reload'), 'utf-8');
  await expect(test).toHaveText('Hello Rsbuild!');

  rsbuild.server.close();
});
