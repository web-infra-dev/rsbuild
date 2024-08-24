import fs from 'node:fs';
import { join } from 'node:path';
import { dev, proxyConsole } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const cwd = __dirname;

test('should show overlay correctly', async ({ page }) => {
  // HMR cases will fail in Windows
  if (process.platform === 'win32') {
    test.skip();
  }

  const { restore } = proxyConsole();

  await fs.promises.cp(join(cwd, 'src'), join(cwd, 'test-temp-src'), {
    recursive: true,
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

  const errorOverlay = page.locator('rsbuild-error-overlay');

  expect(await errorOverlay.locator('.title').count()).toBe(0);

  const appPath = join(cwd, 'test-temp-src/App.tsx');

  await fs.promises.writeFile(
    appPath,
    fs.readFileSync(appPath, 'utf-8').replace('</div>', '</aaaaa>'),
  );

  await expect(errorOverlay.locator('.title')).toHaveText('Compilation failed');

  await rsbuild.close();

  restore();
});
