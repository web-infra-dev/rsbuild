import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';
import { pluginTypeCheck } from '@rsbuild/plugin-type-check';
import { proxyConsole } from '@scripts/helper';

test('should throw error when exist type errors', async () => {
  const { logs, restore } = proxyConsole();
  await expect(
    build({
      cwd: __dirname,
      plugins: [pluginTypeCheck()],
    }),
  ).rejects.toThrowError('build failed!');

  expect(
    logs.find((log) =>
      log.includes(
        `Argument of type 'string' is not assignable to parameter of type 'number'.`,
      ),
    ),
  ).toBeTruthy();

  restore();
});

test('should not throw error when the file is excluded', async () => {
  await expect(
    build({
      cwd: __dirname,
      plugins: [
        pluginTypeCheck({
          forkTsCheckerOptions: {
            issue: {
              exclude: [{ file: '**/index.ts' }],
            },
          },
        }),
      ],
    }),
  ).resolves.toBeTruthy();
});

test('should not throw error when the type checker is not enabled', async () => {
  await expect(
    build({
      cwd: __dirname,
      plugins: [
        pluginTypeCheck({
          enable: false,
        }),
      ],
    }),
  ).resolves.toBeTruthy();
});
