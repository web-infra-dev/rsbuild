import fs from 'node:fs';
import path from 'node:path';
import { expect, rspackTest, runCliSync } from '@e2e/helper';

rspackTest('should support a custom env directory', async () => {
  runCliSync('build --env-dir env', {
    cwd: __dirname,
  });
  const content = fs.readFileSync(
    path.join(__dirname, 'dist/static/js/index.js'),
    'utf-8',
  );
  expect(content).not.toContain('jack');
  expect(content).toContain('rose');
});
