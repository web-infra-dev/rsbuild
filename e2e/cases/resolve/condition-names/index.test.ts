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
  join(__dirname, 'node_modules/@e2e/resolve-condition-names-package-foo'),
);

test('should apply resolve.conditionNames as expected in dev', async ({
  page,
  dev,
}) => {
  await dev({
    config: {
      resolve: {
        conditionNames: ['custom', 'import', 'require'],
      },
    },
  });
  expect(await page.evaluate(() => window.test)).toBe('custom');

  await dev({
    config: {
      resolve: {
        conditionNames: ['require', 'import'],
      },
    },
  });
  expect(await page.evaluate(() => window.test)).toBe('import');
});

test('should apply resolve.conditionNames as expected in build', async ({
  page,
  buildPreview,
}) => {
  await buildPreview({
    config: {
      resolve: {
        conditionNames: ['custom', 'import', 'require'],
      },
    },
  });
  expect(await page.evaluate(() => window.test)).toBe('custom');

  await buildPreview({
    config: {
      resolve: {
        conditionNames: ['require', 'import'],
      },
    },
  });

  // The key order in the `exports` object determines priority
  expect(await page.evaluate(() => window.test)).toBe('import');
});
