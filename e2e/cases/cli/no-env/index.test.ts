import fs from 'node:fs';
import path from 'node:path';
import { expect, rspackOnlyTest, runCliSync } from '@e2e/helper';

rspackOnlyTest('should disable loading env files', async () => {
  runCliSync('build --no-env', {
    cwd: __dirname,
  });
  const content = fs.readFileSync(
    path.join(__dirname, 'dist/static/js/index.js'),
    'utf-8',
  );
  expect(content).toContain('process.env.PUBLIC_NAME');
  expect(content).not.toContain('jack');
});
