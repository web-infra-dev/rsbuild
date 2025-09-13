import fs from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@e2e/helper';
import fse, { remove } from 'fs-extra';

const cwd = __dirname;
const testDistFile = join(cwd, 'dist/test.json');
const testDeepDistFile = join(cwd, 'dist/foo/bar/test.json');

test('should clean dist path by default', async ({ buildOnly }) => {
  await fse.outputFile(testDistFile, `{ "test": 1 }`);

  await buildOnly({
    cwd,
  });

  expect(fs.existsSync(testDistFile)).toBeFalsy();
});

test('should not clean dist path in dev when writeToDisk is false', async ({
  dev,
}) => {
  await fse.outputFile(testDistFile, `{ "test": 1 }`);

  await dev({
    rsbuildConfig: {
      dev: {
        writeToDisk: false,
      },
    },
  });

  expect(fs.existsSync(testDistFile)).toBeTruthy();
  await remove(testDistFile);
});

test('should clean dist path in dev when writeToDisk is true', async ({
  dev,
}) => {
  await fse.outputFile(testDistFile, `{ "test": 1 }`);

  await dev({
    rsbuildConfig: {
      dev: {
        writeToDisk: true,
      },
    },
  });

  expect(fs.existsSync(testDistFile)).toBeFalsy();
});

test('should not clean dist path if it is outside root', async ({
  buildOnly,
}) => {
  const testOutsideFile = join(cwd, '../node_modules/test.json');
  await fse.outputFile(testOutsideFile, `{ "test": 1 }`);

  const rsbuild = await buildOnly({
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
    rsbuild.logs.find((log) =>
      log.includes('dist path is not a subdir of root path'),
    ),
  ).toBeTruthy();

  expect(fs.existsSync(testOutsideFile)).toBeTruthy();

  await remove(testOutsideFile);
});

test('should allow to disable cleanDistPath', async ({ buildOnly }) => {
  await fse.outputFile(testDistFile, `{ "test": 1 }`);

  await buildOnly({
    cwd,
    rsbuildConfig: {
      output: {
        cleanDistPath: false,
      },
    },
  });

  expect(fs.existsSync(testDistFile)).toBeTruthy();

  await remove(testDistFile);
});

test('should allow to use `cleanDistPath.keep` to keep some files', async ({
  buildOnly,
}) => {
  await fse.outputFile(testDistFile, `{ "test": 1 }`);
  await fse.outputFile(testDeepDistFile, `{ "test": 1 }`);

  await buildOnly({
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

  await buildOnly({ cwd });
  expect(fs.existsSync(testDistFile)).toBeFalsy();
  expect(fs.existsSync(testDeepDistFile)).toBeFalsy();
});
