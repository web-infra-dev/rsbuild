import { expect, test } from '@playwright/test';
import { dev, gotoPage, proxyConsole } from '@e2e/helper';
import { join } from 'node:path';
import { fse } from '@rsbuild/shared';

const cwd = __dirname;

test('should show overlay correctly', async ({ page }) => {
  // HMR cases will fail in Windows
  if (process.platform === 'win32') {
    test.skip();
  }

  const { restore } = proxyConsole();

  await fse.copy(join(cwd, 'src'), join(cwd, 'test-temp-src'));

  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
      source: {
        entry: {
          index: join(cwd, 'test-temp-src/index.tsx'),
        },
      },
    },
  });

  await gotoPage(page, rsbuild);

  const errorOverlay = page.locator('rsbuild-error-overlay');

  expect(await errorOverlay.locator('.title').count()).toBe(0);

  const appPath = join(cwd, 'test-temp-src/App.tsx');

  await fse.writeFile(
    appPath,
    fse.readFileSync(appPath, 'utf-8').replace('</div>', '</aaaaa>'),
  );

  await expect(errorOverlay.locator('.title')).toHaveText('Compilation failed');

  await rsbuild.close();

  restore();
});
