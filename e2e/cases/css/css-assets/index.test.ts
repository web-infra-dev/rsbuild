import path from 'node:path';
import { build } from '@e2e/helper';
import { globContentJSON } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should build CSS assets correctly', async () => {
  await expect(build({ cwd: import.meta.dirname })).resolves.toBeDefined();

  const outputs = await globContentJSON(path.join(import.meta.dirname, 'dist'));
  const outputFiles = Object.keys(outputs);

  expect(
    outputFiles.find(
      (item) => item.includes('static/image/image') && item.endsWith('.jpeg'),
    ),
  ).toBeTruthy();
});
