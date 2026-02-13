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
    'node_modules/@e2e/resolve-condition-names-package-foo',
  ),
);

test('should apply resolve.conditionNames as expected', async ({
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
          conditionNames: ['custom', 'import', 'require'],
        },
      },
    },
  );

  await runBothServe(
    async () => {
      // The key order in the `exports` object determines priority
      expect(await page.evaluate(() => window.test)).toBe('import');
    },
    {
      config: {
        resolve: {
          conditionNames: ['require', 'import'],
        },
      },
    },
  );
});
