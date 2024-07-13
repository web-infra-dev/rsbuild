import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

test('should load .env config and set NODE_ENV as expected', async () => {
  execSync('npx rsbuild build', {
    cwd: __dirname,
  });
  expect(fs.existsSync(path.join(__dirname, 'dist/development'))).toBeTruthy();
});
