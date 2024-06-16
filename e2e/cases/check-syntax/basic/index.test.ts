import { build, proxyConsole } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginCheckSyntax } from '@rsbuild/plugin-check-syntax';
import { normalizeToPosixPath } from '@scripts/test-helper';
import stripAnsi from 'strip-ansi';

test('should throw error when exist syntax errors', async () => {
  const cwd = __dirname;
  const { logs, restore } = proxyConsole();

  await expect(
    build({
      cwd,
      plugins: [pluginCheckSyntax()],
    }),
  ).rejects.toThrowError('[Syntax Checker]');

  restore();

  expect(
    logs.find((log) =>
      stripAnsi(log).includes(
        'Find some syntax that does not match "ecmaVersion <= 5"',
      ),
    ),
  ).toBeTruthy();

  expect(logs.find((log) => log.includes('ERROR 1'))).toBeTruthy();
  expect(
    logs.find((log) => log.includes('source:') && log.includes('src/test.js')),
  ).toBeTruthy();
  expect(
    logs.find(
      (log) =>
        log.includes('output:') &&
        normalizeToPosixPath(log).includes('/dist/static/js/index'),
    ),
  ).toBeTruthy();
  expect(logs.find((log) => log.includes('reason:'))).toBeTruthy();
  expect(
    logs.find((log) => log.includes('> 1 | export const printLog = () => {')),
  ).toBeTruthy();
});

test('should check assets with query correctly', async () => {
  const cwd = __dirname;
  const { logs, restore } = proxyConsole();

  const rsbuildConfig = {
    output: {
      filename: {
        js: '[name].js?v=[contenthash:8]',
        css: '[name].css?v=[contenthash:8]',
      },
    },
  };

  await expect(
    build({
      cwd,
      rsbuildConfig,
      plugins: [pluginCheckSyntax()],
    }),
  ).rejects.toThrowError('[Syntax Checker]');

  restore();

  expect(logs.find((log) => log.includes('ERROR 1'))).toBeTruthy();
  expect(
    logs.find((log) => log.includes('source:') && log.includes('src/test.js')),
  ).toBeTruthy();
  expect(
    logs.find(
      (log) =>
        log.includes('output:') &&
        normalizeToPosixPath(log).includes('/dist/static/js/index'),
    ),
  ).toBeTruthy();
  expect(logs.find((log) => log.includes('reason:'))).toBeTruthy();
  expect(
    logs.find((log) => log.includes('> 1 | export const printLog = () => {')),
  ).toBeTruthy();
});

test('should not throw error when the file is excluded', async () => {
  const cwd = __dirname;
  await expect(
    build({
      cwd,
      plugins: [
        pluginCheckSyntax({
          exclude: /src\/test/,
        }),
      ],
    }),
  ).resolves.toBeTruthy();
});

test('should not throw error when the targets are support es6', async () => {
  const cwd = __dirname;

  await expect(
    build({
      cwd,
      plugins: [
        pluginCheckSyntax({
          targets: ['chrome >= 60', 'edge >= 15'],
        }),
      ],
    }),
  ).resolves.toBeTruthy();
});
