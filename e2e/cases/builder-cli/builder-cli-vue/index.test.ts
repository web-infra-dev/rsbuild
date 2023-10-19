import path from 'path';
import { execSync } from 'child_process';
import { expect } from '@playwright/test';
import { globContentJSON } from '@scripts/helper';
import { rspackOnlyTest } from '../../../scripts/helper';

rspackOnlyTest('should build Vue sfc correctly', async () => {
  execSync('npm run build', {
    cwd: __dirname,
  });

  const outputs = await globContentJSON(path.join(__dirname, 'dist'));
  const outputFiles = Object.keys(outputs);

  expect(
    outputFiles.find((item) => item.includes('html/index/index.html')),
  ).toBeTruthy();
  expect(
    outputFiles.find((item) => item.includes('static/js/index.')),
  ).toBeTruthy();
});
