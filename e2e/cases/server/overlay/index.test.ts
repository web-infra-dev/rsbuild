import fs from 'node:fs';
import { join } from 'node:path';
import { createLogHelper, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const cwd = __dirname;

test('should show overlay correctly', async ({ page }) => {
  // HMR cases will fail on Windows
  if (process.platform === 'win32') {
    test.skip();
  }

  await fs.promises.cp(join(cwd, 'src'), join(cwd, 'test-temp-src'), {
    recursive: true,
  });

  const { expectLog, addLog } = createLogHelper();

  page.on('console', (consoleMessage) => {
    addLog(consoleMessage.text());
  });

  const rsbuild = await dev({
    cwd,
    page,
    rsbuildConfig: {
      source: {
        entry: {
          index: join(cwd, 'test-temp-src/index.tsx'),
        },
      },
    },
  });

  await expectLog('[rsbuild] WebSocket connected.');

  const errorOverlay = page.locator('rsbuild-error-overlay');
  expect(await errorOverlay.locator('.title').count()).toBe(0);

  const appPath = join(cwd, 'test-temp-src/App.tsx');
  await fs.promises.writeFile(
    appPath,
    fs.readFileSync(appPath, 'utf-8').replace('</div>', '</aaaaa>'),
  );

  await expectLog('Module build failed');
  await expect(errorOverlay.locator('.title')).toHaveText('Build failed');

  await rsbuild.close();
});
