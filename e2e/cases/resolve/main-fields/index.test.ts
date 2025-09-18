import { join } from 'node:path';
import { expect, test } from '@e2e/helper';
import { copy } from 'fs-extra';

declare global {
  interface Window {
    test: string;
  }
}

copy(
  join(__dirname, 'package-foo'),
  join(__dirname, 'node_modules/@e2e/resolve-main-fields-package-foo'),
);

test('should apply resolve.mainFields as expected in dev', async ({
  page,
  dev,
}) => {
  await dev({
    rsbuildConfig: {
      resolve: {
        mainFields: ['custom', 'module', 'main'],
      },
    },
  });
  expect(await page.evaluate(() => window.test)).toBe('custom');

  await dev({
    rsbuildConfig: {
      resolve: {
        mainFields: ['main', 'module'],
      },
    },
  });
  expect(await page.evaluate(() => window.test)).toBe('main');
});

test('should apply resolve.conditionNames as expected in build', async ({
  page,
  buildPreview,
}) => {
  await buildPreview({
    rsbuildConfig: {
      resolve: {
        mainFields: ['custom', 'module', 'main'],
      },
    },
  });
  expect(await page.evaluate(() => window.test)).toBe('custom');

  await buildPreview({
    rsbuildConfig: {
      resolve: {
        mainFields: ['main', 'module'],
      },
    },
  });

  expect(await page.evaluate(() => window.test)).toBe('main');
});
