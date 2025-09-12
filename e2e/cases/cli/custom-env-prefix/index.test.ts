import fs from 'node:fs';
import path from 'node:path';
import { expect, rspackOnlyTest, runCliSync } from '@e2e/helper';

rspackOnlyTest(
  'should allow to custom env prefix via loadEnv method',
  async () => {
    runCliSync('build', {
      cwd: __dirname,
    });
    const content = fs.readFileSync(
      path.join(__dirname, 'dist/static/js/index.js'),
      'utf-8',
    );
    expect(content).not.toContain('jack');
    expect(content).toContain('rose');
  },
);
