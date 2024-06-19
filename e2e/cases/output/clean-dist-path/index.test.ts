import fs from 'node:fs';
import { join } from 'node:path';
import { build, proxyConsole } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { fse } from '@rsbuild/shared';

const cwd = __dirname;
const testDistFile = join(cwd, 'dist/test.json');

test('should clean dist path by default', async () => {
  await fse.outputFile(testDistFile, `{ "test": 1 }`);

  await build({
    cwd,
  });

  expect(fs.existsSync(testDistFile)).toBeFalsy();
  fs.rmSync(testDistFile, { force: true });
});

test('should not clean dist path if it is outside root', async () => {
  const { logs, restore } = proxyConsole();
  const testOutsideFile = join(cwd, '../node_modules/test.json');
  await fse.outputFile(testOutsideFile, `{ "test": 1 }`);

  await build({
    cwd,
    rsbuildConfig: {
      output: {
        distPath: {
          root: '../node_modules',
        },
      },
    },
  });

  expect(
    logs.find((log) => log.includes('dist path is not a subdir of root path')),
  ).toBeTruthy();

  expect(fs.existsSync(testOutsideFile)).toBeTruthy();

  fs.rmSync(testOutsideFile, { force: true });
  restore();
});

test('should allow to disable cleanDistPath', async () => {
  await fse.outputFile(testDistFile, `{ "test": 1 }`);

  await build({
    cwd,
    rsbuildConfig: {
      output: {
        cleanDistPath: false,
      },
    },
  });

  expect(fs.existsSync(testDistFile)).toBeTruthy();

  fs.rmSync(testDistFile, { force: true });
});
