import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const cwd = __dirname;

test('should not print file size if has errors', async () => {
  const rsbuild = await build({
    cwd,
    catchBuildError: true,
    rsbuildConfig: {
      performance: {
        printFileSize: true,
      },
    },
  });

  expect(rsbuild.buildError).toBeTruthy();
  expect(rsbuild.logs.some((log) => log.includes('Total:'))).toBeFalsy();

  await rsbuild.close();
});
