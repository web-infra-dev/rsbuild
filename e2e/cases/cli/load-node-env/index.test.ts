import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

// see: https://github.com/web-infra-dev/rsbuild/issues/2904
rspackOnlyTest(
  'should load .env config and set NODE_ENV as expected',
  async () => {
    execSync('npx rsbuild build', {
      cwd: __dirname,
    });
    expect(
      fs.existsSync(path.join(__dirname, 'dist/development')),
    ).toBeTruthy();
  },
);
