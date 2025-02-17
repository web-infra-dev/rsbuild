import fs from 'node:fs';
import { join } from 'node:path';
import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to import TS files with .js extension', async ({ page }) => {
  await build({
    cwd: import.meta.dirname,
    page,
  });
  expect(await page.evaluate(() => window.test)).toBe('ts');
});

test('should resolve the .js file first if both .js and .ts exist', async ({
  page,
}) => {
  await fs.promises.cp(
    join(import.meta.dirname, 'src'),
    join(import.meta.dirname, 'test-temp-src'),
    {
      recursive: true,
    },
  );

  fs.writeFileSync(
    join(import.meta.dirname, 'test-temp-src/foo.js'),
    'export const foo = "js";',
  );

  await build({
    cwd: import.meta.dirname,
    page,
    rsbuildConfig: {
      source: {
        entry: {
          index: join(import.meta.dirname, 'test-temp-src/index.ts'),
        },
      },
    },
  });

  expect(await page.evaluate(() => window.test)).toBe('js');

  fs.rmSync(join(import.meta.dirname, 'test-temp-src'), { recursive: true });
});
