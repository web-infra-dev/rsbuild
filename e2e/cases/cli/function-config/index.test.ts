import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { globContentJSON, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should allow to export function in config file', async () => {
  const targetDir = path.join(__dirname, 'dist-production-build');

  fs.rmSync(targetDir, { recursive: true, force: true });

  delete process.env.NODE_ENV;
  execSync('npx rsbuild build', {
    cwd: __dirname,
  });

  const outputs = await globContentJSON(targetDir);
  const outputFiles = Object.keys(outputs);

  expect(outputFiles.length > 1).toBeTruthy();
});
