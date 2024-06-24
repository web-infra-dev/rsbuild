import { build, proxyConsole } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginCheckSyntax } from '@rsbuild/plugin-check-syntax';
import { normalizeToPosixPath } from '@scripts/test-helper';

test('should throw error when using optional chaining and target is es6 browsers', async () => {
  const cwd = __dirname;
  const { logs, restore } = proxyConsole();

  await expect(
    build({
      cwd,
      plugins: [
        pluginCheckSyntax({
          targets: ['chrome >= 53'],
        }),
      ],
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
  expect(
    logs.find(
      (log) => log.includes('reason:') && log.includes('Unexpected token'),
    ),
  ).toBeTruthy();
  expect(
    logs.find((log) => log.includes('> 3 |   console.log(arr, arr?.flat());')),
  ).toBeTruthy();
});

test('should throw error when using optional chaining and target is fully supports es6-module', async () => {
  const cwd = __dirname;
  const { logs, restore } = proxyConsole();

  await expect(
    build({
      cwd,
      plugins: [
        pluginCheckSyntax({
          targets: ['fully supports es6-module'],
        }),
      ],
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
  expect(
    logs.find(
      (log) => log.includes('reason:') && log.includes('Unexpected token'),
    ),
  ).toBeTruthy();
  expect(
    logs.find((log) => log.includes('> 3 |   console.log(arr, arr?.flat());')),
  ).toBeTruthy();
});

test('should not throw error when using optional chaining and ecmaVersion is 2020', async () => {
  const cwd = __dirname;

  await expect(
    build({
      cwd,
      plugins: [
        pluginCheckSyntax({
          ecmaVersion: 2020,
        }),
      ],
    }),
  ).resolves.toBeTruthy();
});
