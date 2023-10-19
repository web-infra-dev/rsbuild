import path from 'path';
import { execSync } from 'child_process';
import { expect, test } from '@playwright/test';
import { globContentJSON } from '@scripts/helper';

test('should run build command correctly', async () => {
  execSync('npm run build', {
    cwd: __dirname,
  });

  const outputs = await globContentJSON(path.join(__dirname, 'dist'));
  const outputFiles = Object.keys(outputs);

  expect(outputFiles.find((item) => item.includes('index.html'))).toBeTruthy();
  expect(
    outputFiles.find((item) => item.includes('static/js/index.')),
  ).toBeTruthy();
});
