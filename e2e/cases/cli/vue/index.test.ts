import path from 'path';
import { execSync } from 'child_process';
import { expect } from '@playwright/test';
import { rspackOnlyTest, globContentJSON } from '../../../scripts/helper';

rspackOnlyTest('should build Vue sfc correctly', async () => {
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
