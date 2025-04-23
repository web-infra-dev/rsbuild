import path from 'node:path';
import { build, readDirContents } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should set default entry when entry is set to an empty object', async () => {
  await build({
    cwd: __dirname,
  });

  const outputs = await readDirContents(path.join(__dirname, 'dist'));
  const outputFiles = Object.keys(outputs);

  expect(
    outputFiles.find((item) => item.includes('static/js/index.')),
  ).toBeTruthy();
});
