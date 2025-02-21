import { execSync } from 'node:child_process';
import path from 'node:path';
import { globContentJSON, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should run allow to specify base path', async () => {
  execSync('npx rsbuild build --base /test', {
    cwd: __dirname,
  });

  const outputs = await globContentJSON(path.join(__dirname, 'dist'));
  const outputFiles = Object.keys(outputs);

  expect(
    outputFiles.find((item) =>
      outputs[item].includes('/test/static/js/index.'),
    ),
  ).toBeTruthy();
});
