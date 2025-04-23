import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should process assets when target is web', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      output: {
        target: 'web',
      },
    },
  });

  const files = await rsbuild.getDistFiles();
  const indexJs = Object.keys(files).find(
    (file) => file.includes('index') && file.endsWith('.js'),
  );
  expect(indexJs).toBeFalsy();
});

rspackOnlyTest('should not process assets when target is not web', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      output: {
        target: 'web-worker',
      },
    },
  });

  const files = await rsbuild.getDistFiles();
  const indexJs = Object.keys(files).find(
    (file) => file.includes('index') && file.endsWith('.js'),
  );
  expect(indexJs).toBeTruthy();
});
