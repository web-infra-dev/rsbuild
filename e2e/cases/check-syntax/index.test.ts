import path from 'path';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';
import { pluginCheckSyntax } from '@rsbuild/plugin-check-syntax';
import type { SharedRsbuildConfig } from '@rsbuild/shared';

function getCommonBuildConfig(cwd: string): SharedRsbuildConfig {
  return {
    source: {
      exclude: [path.resolve(cwd, './src/test.js')],
    },
    output: {
      overrideBrowserslist: ['ie 11'],
    },
    tools: {
      // @ts-expect-error
      rspack: (config) => {
        config.target = ['web'];
        config.builtins.presetEnv = undefined;
      },
    },
  };
}

test('should throw error when exist syntax errors', async () => {
  const cwd = path.join(__dirname, 'fixtures/basic');
  await expect(
    build({
      cwd,
      entry: { index: path.resolve(cwd, './src/index.js') },
      rsbuildConfig: getCommonBuildConfig(cwd),
      plugins: [pluginCheckSyntax()],
    }),
  ).rejects.toThrowError('[Syntax Checker]');
});

test('should not throw error when the file is excluded', async () => {
  const cwd = path.join(__dirname, 'fixtures/basic');
  await expect(
    build({
      cwd,
      entry: { index: path.resolve(cwd, './src/index.js') },
      plugins: [
        pluginCheckSyntax({
          exclude: /src\/test/,
        }),
      ],
      rsbuildConfig: getCommonBuildConfig(cwd),
    }),
  ).resolves.toBeTruthy();
});

test('should not throw error when the targets are support es6', async () => {
  const cwd = path.join(__dirname, 'fixtures/basic');

  await expect(
    build({
      cwd,
      entry: { index: path.resolve(cwd, './src/index.js') },
      plugins: [
        pluginCheckSyntax({
          targets: ['chrome >= 60', 'edge >= 15'],
        }),
      ],
      rsbuildConfig: getCommonBuildConfig(cwd),
    }),
  ).resolves.toBeTruthy();
});

test('should throw error when using optional chaining and target is es6 browsers', async () => {
  const cwd = path.join(__dirname, 'fixtures/esnext');

  await expect(
    build({
      cwd,
      entry: { index: path.resolve(cwd, './src/index.js') },
      plugins: [
        pluginCheckSyntax({
          targets: ['chrome >= 53'],
        }),
      ],
      rsbuildConfig: getCommonBuildConfig(cwd),
    }),
  ).rejects.toThrowError('[Syntax Checker]');
});

test('should not throw error when using optional chaining and ecmaVersion is 2020', async () => {
  const cwd = path.join(__dirname, 'fixtures/esnext');

  await expect(
    build({
      cwd,
      entry: { index: path.resolve(cwd, './src/index.js') },
      plugins: [
        pluginCheckSyntax({
          ecmaVersion: 2020,
        }),
      ],
      rsbuildConfig: getCommonBuildConfig(cwd),
    }),
  ).resolves.toBeTruthy();
});
