import path from 'node:path';
import { execSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { globContentJSON } from '@e2e/helper';

test('should run build command correctly', async () => {
  execSync('npx rsbuild build', {
    cwd: __dirname,
  });

  const outputs = await globContentJSON(path.join(__dirname, 'dist'));
  const outputFiles = Object.keys(outputs);

  expect(outputFiles.find((item) => item.includes('index.html'))).toBeTruthy();
  expect(
    outputFiles.find((item) => item.includes('static/js/index.')),
  ).toBeTruthy();
});
