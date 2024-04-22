import { execSync } from 'node:child_process';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { fse } from '@rsbuild/shared';

test('should inject public env vars to client', async () => {
  execSync('npx rsbuild build', {
    cwd: __dirname,
  });
  const content = fse.readFileSync(
    path.join(__dirname, 'dist/static/js/index.js'),
    'utf-8',
  );
  expect(content).not.toContain('jack');
  expect(content).toContain('rose');
});
