import fs from 'node:fs';
import path from 'node:path';
import { expect, rspackTest, test } from '@e2e/helper';
import fse, { remove } from 'fs-extra';

const localFile = path.join(__dirname, '.env.local');
const prodLocalFile = path.join(__dirname, '.env.production.local');

test.beforeEach(async () => {
  await remove(localFile);
  await remove(prodLocalFile);
});

rspackTest(
  'should load .env config and allow rsbuild.config.ts to read env vars',
  async ({ execCliSync }) => {
    execCliSync('build');
    expect(fs.existsSync(path.join(__dirname, 'dist/1'))).toBeTruthy();
  },
);

rspackTest(
  'should load .env.local with higher priority',
  async ({ execCliSync }) => {
    fse.outputFileSync(localFile, 'FOO=2');
    execCliSync('build');
    expect(fs.existsSync(path.join(__dirname, 'dist/2'))).toBeTruthy();
  },
);

rspackTest(
  'should load .env.production.local with higher priority',
  async ({ execCliSync }) => {
    fse.outputFileSync(localFile, 'FOO=2');
    fse.outputFileSync(prodLocalFile, 'FOO=3');
    execCliSync('build');
    expect(fs.existsSync(path.join(__dirname, 'dist/3'))).toBeTruthy();
  },
);

rspackTest(
  'should support specifying env mode via --env-mode',
  async ({ execCliSync }) => {
    execCliSync('build --env-mode test');
    expect(fs.existsSync(path.join(__dirname, 'dist/5'))).toBeTruthy();
  },
);
