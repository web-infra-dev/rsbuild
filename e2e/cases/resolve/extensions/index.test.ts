import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should apply resolve.extensions as expected', async ({ page }) => {
  await build({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      resolve: {
        extensions: ['.ts', '.js'],
      },
    },
  });

  expect(await page.evaluate(() => window.test)).toBe('ts');

  await build({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      resolve: {
        extensions: ['.js', '.ts'],
      },
    },
  });

  expect(await page.evaluate(() => window.test)).toBe('js');
});
