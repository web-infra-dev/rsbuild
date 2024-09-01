import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

test('should allow to custom env directory', async () => {
  execSync('npx rsbuild build --env-dir env', {
    cwd: __dirname,
  });
  const content = fs.readFileSync(
    path.join(__dirname, 'dist/static/js/index.js'),
    'utf-8',
  );
  expect(content).not.toContain('jack');
  expect(content).toContain('rose');
});
