import { execSync } from 'node:child_process';
import path from 'node:path';
import { globContentJSON, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should use Node.js native loader to load config', async () => {
  execSync('npx rsbuild build --config-loader native', {
    cwd: __dirname,
    env: {
      ...process.env,
      NODE_OPTIONS: '--experimental-strip-types',
    },
  });

  const outputs = await globContentJSON(path.join(__dirname, 'dist-custom'));
  const outputFiles = Object.keys(outputs);

  expect(outputFiles.length > 1).toBeTruthy();
});
