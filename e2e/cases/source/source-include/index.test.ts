import { build, proxyConsole } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginCheckSyntax } from '@rsbuild/plugin-check-syntax';

test('should compile modules outside of project by default', async () => {
  const { logs, restore } = proxyConsole();
  await expect(
    build({
      cwd: __dirname,
      plugins: [pluginCheckSyntax()],
      rsbuildConfig: {
        output: {
          overrideBrowserslist: ['ie 11'],
        },
      },
    }),
  ).resolves.toBeDefined();

  expect(logs.find((log) => log.includes('Syntax check passed'))).toBeTruthy();
  restore();
});
