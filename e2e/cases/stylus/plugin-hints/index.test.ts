import { build, proxyConsole, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should print Stylus plugin hints as expected', async () => {
  const { logs, restore } = proxyConsole();

  await expect(
    build({
      cwd: __dirname,
    }),
  ).rejects.toThrowError('build failed');

  expect(
    logs.some((log) =>
      log.includes(
        'To enable support for Stylus, use "@rsbuild/plugin-stylus"',
      ),
    ),
  ).toBeTruthy();

  restore();
});
