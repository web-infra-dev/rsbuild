import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from '@e2e/helper';

test('should build a web worker and specify the chunk name', async ({
  page,
  build,
}) => {
  await build();

  await expect(page.locator('#root')).toHaveText(
    'The Answer to the Ultimate Question of Life, The Universe, and Everything: 42',
  );

  const workerFilePath = join(__dirname, 'dist/static/js/async/foo-worker.js');
  expect(existsSync(workerFilePath)).toBeTruthy();
});
