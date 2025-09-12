import fs from 'node:fs';
import path from 'node:path';
import { expect, rspackOnlyTest, runCliSync } from '@e2e/helper';

rspackOnlyTest('should inject public env vars to client', async () => {
  runCliSync('build', {
    cwd: __dirname,
    env: {
      ...process.env,
      NODE_ENV: 'production',
    },
  });

  const content = fs.readFileSync(
    path.join(__dirname, 'dist/static/js/index.js'),
    'utf-8',
  );
  expect(content).not.toContain('jack');
  expect(content).toContain('"process.env","rose"');
  expect(content).toContain('"import.meta.env","rose"');
});
