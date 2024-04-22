import { execSync } from 'node:child_process';
import path from 'node:path';
import { globContentJSON } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { fse } from '@rsbuild/shared';

test('should allow to export function in config file', async () => {
  const targetDir = path.join(__dirname, 'dist-production-build');
  fse.removeSync(targetDir);

  delete process.env.NODE_ENV;
  execSync('npx rsbuild build', {
    cwd: __dirname,
  });

  const outputs = await globContentJSON(targetDir);
  const outputFiles = Object.keys(outputs);

  expect(outputFiles.length > 1).toBeTruthy();
});
