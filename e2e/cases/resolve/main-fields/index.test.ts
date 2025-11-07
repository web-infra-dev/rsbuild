import { join } from 'node:path';
import { expect, test } from '@e2e/helper';
import fse from 'fs-extra';

declare global {
  interface Window {
    test: string;
  }
}

fse.copy(
  join(import.meta.dirname, 'package-foo'),
  join(
    import.meta.dirname,
    'node_modules/@e2e/resolve-main-fields-package-foo',
  ),
);

test('should apply resolve.mainFields as expected in dev', async ({
  page,
  dev,
}) => {
  await dev({
    config: {
      resolve: {
        mainFields: ['custom', 'module', 'main'],
      },
    },
  });
  expect(await page.evaluate(() => window.test)).toBe('custom');

  await dev({
    config: {
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
    config: {
      resolve: {
        mainFields: ['custom', 'module', 'main'],
      },
    },
  });
  expect(await page.evaluate(() => window.test)).toBe('custom');

  await buildPreview({
    config: {
      resolve: {
        mainFields: ['main', 'module'],
      },
    },
  });

  expect(await page.evaluate(() => window.test)).toBe('main');
});
