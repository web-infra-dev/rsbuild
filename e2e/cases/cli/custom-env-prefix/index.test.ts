import fs from 'node:fs';
import path from 'node:path';
import { rspackOnlyTest, runCliSync } from '@e2e/helper';
import { expect } from '@playwright/test';

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
