import { execSync } from 'node:child_process';
import path from 'node:path';
import { globContentJSON, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import { remove } from 'fs-extra';

rspackOnlyTest('should allow to export function in config file', async () => {
  const targetDir = path.join(__dirname, 'dist-production-build');

  await remove(targetDir);

  delete process.env.NODE_ENV;
  execSync('npx rsbuild build', {
    cwd: __dirname,
  });

  const outputs = await globContentJSON(targetDir);
  const outputFiles = Object.keys(outputs);

  expect(outputFiles.length > 1).toBeTruthy();
});
