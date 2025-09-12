import fs from 'node:fs';
import { join } from 'node:path';

import { expect, test } from '@e2e/helper';
import { remove } from 'fs-extra';

test('should allow to import TS files with .js extension', async ({
  page,
  build,
}) => {
  await build();
  expect(await page.evaluate(() => window.test)).toBe('ts');
});

test('should resolve the .js file first if both .js and .ts exist', async ({
  page,
  build,
}) => {
  await fs.promises.cp(
    join(__dirname, 'src'),
    join(__dirname, 'test-temp-src'),
    {
      recursive: true,
    },
  );

  fs.writeFileSync(
    join(__dirname, 'test-temp-src/foo.js'),
    'export const foo = "js";',
  );

  await build({
    rsbuildConfig: {
      source: {
        entry: {
          index: join(__dirname, 'test-temp-src/index.ts'),
        },
      },
    },
  });

  expect(await page.evaluate(() => window.test)).toBe('js');

  await remove(join(__dirname, 'test-temp-src'));
});
