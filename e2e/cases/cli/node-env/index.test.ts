import { execSync } from 'node:child_process';
import path from 'node:path';
import { globContentJSON } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should set NODE_ENV correctly when running build command', async () => {
  delete process.env.NODE_ENV;
  execSync('npx rsbuild build', {
    cwd: __dirname,
  });

  const outputs = await globContentJSON(path.join(__dirname, 'dist-prod'));
  const outputFiles = Object.keys(outputs);

  expect(outputFiles.length > 1).toBeTruthy();
});
