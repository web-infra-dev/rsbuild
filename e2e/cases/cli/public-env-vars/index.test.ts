import { execSync } from 'node:child_process';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { fse } from '@rsbuild/shared';

test('should inject public env vars to client', async () => {
  const { NODE_ENV } = process.env;
  process.env.NODE_ENV = 'production';

  execSync('npx rsbuild build', {
    cwd: __dirname,
  });

  const content = fse.readFileSync(
    path.join(__dirname, 'dist/static/js/index.js'),
    'utf-8',
  );
  expect(content).not.toContain('jack');
  expect(content).toContain('"process.env","rose"');
  expect(content).toContain('"import.meta.env","rose"');

  process.env.NODE_ENV = NODE_ENV;
});
