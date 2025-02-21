import path from 'node:path';
import { build, globContentJSON } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to set entry description object', async () => {
  await build({
    cwd: __dirname,
  });

  const outputs = await globContentJSON(path.join(__dirname, 'dist'));
  const outputFiles = Object.keys(outputs);

  expect(
    outputFiles.find((item) => item.includes('static/js/foo.')),
  ).toBeTruthy();
  expect(
    outputFiles.find((item) => item.includes('static/js/bar.')),
  ).toBeTruthy();
});
