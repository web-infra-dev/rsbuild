import { build, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const utf8Str = `你好 world! I'm 🦀`;

test('should resolve emoji filename in dev', async ({ page }) => {
  const rsbuild = await dev({
    cwd: __dirname,
    rsbuildConfig: {
      dev: {
        writeToDisk: true,
      },
    },
    page,
  });

  expect(await page.evaluate('window.test')).toBe(utf8Str);
  await rsbuild.close();
});

test('should resolve emoji filename in build', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
  });

  expect(await page.evaluate('window.test')).toBe(utf8Str);

  const content = await rsbuild.getIndexBundle();
  expect(content.includes(utf8Str)).toBeTruthy();

  await rsbuild.close();
});
