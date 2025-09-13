import fs from 'node:fs';
import path from 'node:path';
import { expect, rspackTest, test } from '@e2e/helper';

const appFile = path.join(__dirname, 'src/App.jsx');
let appCode: string;

test.beforeEach(() => {
  appCode = fs.readFileSync(appFile, 'utf-8');
});

test.afterEach(() => {
  // recover the source code
  fs.writeFileSync(appFile, appCode, 'utf-8');
});

rspackTest(
  'should fallback to live-reload when dev.hmr is false',
  async ({ page, dev, editFile }) => {
    await dev();
    const testEl = page.locator('#test');
    await expect(testEl).toHaveText('Hello Rsbuild!');
    await editFile(appFile, (code) => code.replace('Rsbuild', 'Live Reload'));
    await expect(testEl).toHaveText('Hello Live Reload!');
  },
);

rspackTest(
  'should not reload page when live-reload is disabled',
  async ({ page, dev, editFile }) => {
    await dev({
      rsbuildConfig: {
        dev: {
          liveReload: false,
        },
      },
    });

    const test = page.locator('#test');
    await expect(test).toHaveText('Hello Rsbuild!');
    await editFile(appFile, (code) => code.replace('Rsbuild', 'Live Reload'));
    await expect(test).toHaveText('Hello Rsbuild!');
  },
);
