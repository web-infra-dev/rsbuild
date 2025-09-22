import fs from 'node:fs';
import path from 'node:path';
import { expect, rspackTest } from '@e2e/helper';

rspackTest('should support a custom env directory', async ({ execCliSync }) => {
  execCliSync('build --env-dir env');
  const content = fs.readFileSync(
    path.join(__dirname, 'dist/static/js/index.js'),
    'utf-8',
  );
  expect(content).not.toContain('jack');
  expect(content).toContain('rose');
});
