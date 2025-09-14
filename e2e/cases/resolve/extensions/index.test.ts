import { expect, test } from '@e2e/helper';

test('should apply resolve.conditionNames as expected', async ({
  page,
  buildPreview,
}) => {
  await buildPreview({
    rsbuildConfig: {
      resolve: {
        extensions: ['.ts', '.js'],
      },
    },
  });

  expect(await page.evaluate(() => window.test)).toBe('ts');

  await buildPreview({
    rsbuildConfig: {
      resolve: {
        extensions: ['.js', '.ts'],
      },
    },
  });

  expect(await page.evaluate(() => window.test)).toBe('js');
});
