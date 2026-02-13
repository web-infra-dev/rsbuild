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

test('should apply resolve.mainFields as expected', async ({
  page,
  runBothServe,
}) => {
  await runBothServe(
    async () => {
      expect(await page.evaluate(() => window.test)).toBe('custom');
    },
    {
      config: {
        resolve: {
          mainFields: ['custom', 'module', 'main'],
        },
      },
    },
  );

  await runBothServe(
    async () => {
      expect(await page.evaluate(() => window.test)).toBe('main');
    },
    {
      config: {
        resolve: {
          mainFields: ['main', 'module'],
        },
      },
    },
  );
});
