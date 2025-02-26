import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should allow plugin to process assets by environments',
  async () => {
    const rsbuild = await build({
      cwd: __dirname,
    });

    expect(existsSync(join(rsbuild.distPath, 'static/index.js'))).toBeFalsy();
    expect(existsSync(join(rsbuild.distPath, 'server/index.js'))).toBeTruthy();
  },
);
