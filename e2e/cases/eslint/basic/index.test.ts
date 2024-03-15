import { expect, test } from '@playwright/test';
import { build } from '@e2e/helper';
import { proxyConsole } from '@e2e/helper';
import { pluginEslint } from '@rsbuild/plugin-eslint';

test('should throw error when exist ESLint errors', async () => {
  const { logs, restore } = proxyConsole();
  await expect(
    build({
      cwd: __dirname,
      plugins: [pluginEslint()],
    }),
  ).rejects.toThrowError('build failed!');

  expect(
    logs.find((log) => log.includes(`'undefinedVar' is not defined`)),
  ).toBeTruthy();

  restore();
});

test('should not throw error when the file is excluded', async () => {
  await expect(
    build({
      cwd: __dirname,
      plugins: [
        pluginEslint({
          eslintPluginOptions: {
            exclude: ['node_modules', './src/index.js'],
          },
        }),
      ],
    }),
  ).resolves.toBeTruthy();
});

test('should not throw error when the ESLint plugin is not enabled', async () => {
  await expect(
    build({
      cwd: __dirname,
      plugins: [
        pluginEslint({
          enable: false,
        }),
      ],
    }),
  ).resolves.toBeTruthy();
});
