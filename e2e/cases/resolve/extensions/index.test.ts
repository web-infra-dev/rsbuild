import { expect, test } from '@e2e/helper';

test('should apply resolve.extensions as expected', async ({ page, build }) => {
  await build({
    rsbuildConfig: {
      resolve: {
        extensions: ['.ts', '.js'],
      },
    },
  });

  expect(await page.evaluate(() => window.test)).toBe('ts');

  await build({
    rsbuildConfig: {
      resolve: {
        extensions: ['.js', '.ts'],
      },
    },
  });

  expect(await page.evaluate(() => window.test)).toBe('js');
});
