import fs from 'node:fs';
import path from 'node:path';
import { expect, rspackOnlyTest, runCliSync, test } from '@e2e/helper';
import fse, { remove } from 'fs-extra';

const localFile = path.join(__dirname, '.env.local');
const prodLocalFile = path.join(__dirname, '.env.production.local');

test.beforeEach(async () => {
  await remove(localFile);
  await remove(prodLocalFile);
});

rspackOnlyTest(
  'should load .env config and allow rsbuild.config.ts to read env vars',
  async () => {
    runCliSync('build', {
      cwd: __dirname,
    });
    expect(fs.existsSync(path.join(__dirname, 'dist/1'))).toBeTruthy();
  },
);

rspackOnlyTest('should load .env.local with higher priority', async () => {
  fse.outputFileSync(localFile, 'FOO=2');

  runCliSync('build', {
    cwd: __dirname,
  });
  expect(fs.existsSync(path.join(__dirname, 'dist/2'))).toBeTruthy();
});

rspackOnlyTest(
  'should load .env.production.local with higher priority',
  async () => {
    fse.outputFileSync(localFile, 'FOO=2');
    fse.outputFileSync(prodLocalFile, 'FOO=3');

    runCliSync('build', {
      cwd: __dirname,
    });
    expect(fs.existsSync(path.join(__dirname, 'dist/3'))).toBeTruthy();
  },
);

rspackOnlyTest(
  'should support specifying env mode via --env-mode',
  async () => {
    runCliSync('build --env-mode test', {
      cwd: __dirname,
    });

    expect(fs.existsSync(path.join(__dirname, 'dist/5'))).toBeTruthy();
  },
);
