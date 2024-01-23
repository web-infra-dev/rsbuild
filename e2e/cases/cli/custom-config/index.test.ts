import path from 'node:path';
import { execSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { globContentJSON } from '../../../scripts/helper';

test('should use custom config when using --config option', async () => {
  execSync('npx rsbuild build --config ./custom.config.mjs', {
    cwd: __dirname,
  });

  const outputs = await globContentJSON(path.join(__dirname, 'dist-custom'));
  const outputFiles = Object.keys(outputs);

  expect(outputFiles.length > 1).toBeTruthy();
});

test('should support custom config to find absolute path', async () => {
  const absPath = path.join(__dirname, 'custom.config.mjs');
  execSync(`npx rsbuild build --config ${absPath}`, {
    cwd: __dirname,
  });
  const outputs = await globContentJSON(path.join(__dirname, 'dist-custom'));
  const outputFiles = Object.keys(outputs);

  expect(outputFiles.length > 1).toBeTruthy();
});
