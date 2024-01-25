import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { fse } from '@rsbuild/shared';
import { build, proxyConsole } from '@e2e/helper';

const cwd = __dirname;
const testDistFile = join(cwd, 'dist/test.json');

test('should clean dist path by default', async () => {
  await fse.outputFile(testDistFile, `{ "test": 1 }`);

  await build({
    cwd,
  });

  expect(fse.existsSync(testDistFile)).toBeFalsy();
  fse.removeSync(testDistFile);
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

  expect(fse.existsSync(testOutsideFile)).toBeTruthy();

  fse.removeSync(testOutsideFile);
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

  expect(fse.existsSync(testDistFile)).toBeTruthy();

  fse.removeSync(testDistFile);
});
