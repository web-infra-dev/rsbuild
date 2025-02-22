import fs from 'node:fs';
import { join } from 'node:path';
import { build, dev, proxyConsole } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import fse from 'fs-extra';

const cwd = __dirname;
const testDistFile = join(cwd, 'dist/test.json');
const testDeepDistFile = join(cwd, 'dist/foo/bar/test.json');

test('should clean dist path by default', async () => {
  await fse.outputFile(testDistFile, `{ "test": 1 }`);

  await build({
    cwd,
  });

  expect(fs.existsSync(testDistFile)).toBeFalsy();
});

test('should not clean dist path in dev mode when writeToDisk is false', async () => {
  await fse.outputFile(testDistFile, `{ "test": 1 }`);

  await dev({
    cwd,
    rsbuildConfig: {
      dev: {
        writeToDisk: false,
      },
    },
  });

  expect(fs.existsSync(testDistFile)).toBeTruthy();
  fs.rmSync(testDistFile, { force: true });
});

test('should clean dist path in dev mode when writeToDisk is true', async () => {
  await fse.outputFile(testDistFile, `{ "test": 1 }`);

  await dev({
    cwd,
    rsbuildConfig: {
      dev: {
        writeToDisk: true,
      },
    },
  });

  expect(fs.existsSync(testDistFile)).toBeFalsy();
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

test('should allow to use `cleanDistPath.keep` to keep some files', async () => {
  await fse.outputFile(testDistFile, `{ "test": 1 }`);
  await fse.outputFile(testDeepDistFile, `{ "test": 1 }`);

  await build({
    cwd,
    rsbuildConfig: {
      output: {
        cleanDistPath: {
          keep: [/dist\/test.json/, /dist\/foo\/bar\/test.json/],
        },
      },
    },
  });

  expect(fs.existsSync(testDistFile)).toBeTruthy();
  expect(fs.existsSync(testDeepDistFile)).toBeTruthy();

  await build({ cwd });
  expect(fs.existsSync(testDistFile)).toBeFalsy();
  expect(fs.existsSync(testDeepDistFile)).toBeFalsy();
});
