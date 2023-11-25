import { fse } from '@rsbuild/shared';
import path from 'path';
import { execSync } from 'child_process';
import { expect, test } from '@playwright/test';
import { globContentJSON } from '../../../scripts/helper';

test('should allow to export function in config file', async () => {
  const targetDir = path.join(__dirname, 'dist-production-build');
  fse.removeSync(targetDir);

  execSync('npx rsbuild build', {
    cwd: __dirname,
  });

  const outputs = await globContentJSON(targetDir);
  const outputFiles = Object.keys(outputs);

  expect(outputFiles.length > 1).toBeTruthy();
});
