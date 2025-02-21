import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to build web-worker and specify chunk name', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
  });

  await expect(page.locator('#root')).toHaveText(
    'The Answer to the Ultimate Question of Life, The Universe, and Everything: 42',
  );

  const workerFilePath = join(__dirname, 'dist/static/js/async/foo-worker.js');
  expect(existsSync(workerFilePath)).toBeTruthy();

  await rsbuild.close();
});
