import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should allow to disable loading env files', async () => {
  execSync('npx rsbuild build --no-env', {
    cwd: __dirname,
  });
  const content = fs.readFileSync(
    path.join(__dirname, 'dist/static/js/index.js'),
    'utf-8',
  );
  expect(content).toContain('process.env.PUBLIC_NAME');
  expect(content).not.toContain('jack');
});
