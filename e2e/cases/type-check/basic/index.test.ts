import { build, dev, gotoPage } from '@e2e/helper';
import { proxyConsole } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginTypeCheck } from '@rsbuild/plugin-type-check';

test('should throw error when exist type errors', async () => {
  const { logs, restore } = proxyConsole();
  await expect(
    build({
      cwd: __dirname,
      plugins: [pluginTypeCheck()],
    }),
  ).rejects.toThrowError('build failed!');

  expect(
    logs.find((log) => log.includes('File:') && log.includes('/src/index.ts')),
  ).toBeTruthy();

  expect(
    logs.find((log) =>
      log.includes(
        `Argument of type 'string' is not assignable to parameter of type 'number'.`,
      ),
    ),
  ).toBeTruthy();

  restore();
});

test('should throw error when exist type errors in dev mode', async ({
  page,
}) => {
  const { logs, restore } = proxyConsole();

  const rsbuild = await dev({
    cwd: __dirname,
    plugins: [
      pluginTypeCheck({
        forkTsCheckerOptions: {
          async: false,
        },
      }),
    ],
  });

  await gotoPage(page, rsbuild);

  expect(
    logs.find((log) => log.includes('File:') && log.includes('/src/index.ts')),
  ).toBeTruthy();

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

test('should not throw error when the file is excluded by code', async () => {
  await expect(
    build({
      cwd: __dirname,
      plugins: [
        pluginTypeCheck({
          forkTsCheckerOptions: {
            issue: {
              exclude: [{ code: 'TS2345' }],
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
