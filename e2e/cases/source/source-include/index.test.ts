import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginCheckSyntax } from '@rsbuild/plugin-check-syntax';

test('should compile modules outside of project by default', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    plugins: [pluginCheckSyntax()],
    catchBuildError: true,
    rsbuildConfig: {
      output: {
        overrideBrowserslist: ['ie 11'],
      },
    },
  });

  expect(rsbuild.buildError).toBeFalsy();
  expect(
    rsbuild.logs.find((log) => log.includes('Syntax check passed')),
  ).toBeTruthy();

  await rsbuild.close();
});
