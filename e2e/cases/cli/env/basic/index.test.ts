import path from 'path';
import { expect, test } from '@playwright/test';
import { fse } from '@rsbuild/shared';
import { execSync } from 'child_process';

const localFile = path.join(__dirname, '.env.local');
const prodLocalFile = path.join(__dirname, '.env.production.local');

test.beforeEach(() => {
  fse.removeSync(localFile);
  fse.removeSync(prodLocalFile);
});

test('should load .env config and allow rsbuild.config.ts to read env vars', async () => {
  execSync('npx rsbuild build', {
    cwd: __dirname,
  });
  expect(fse.existsSync(path.join(__dirname, 'dist/1'))).toBeTruthy();
});

test('should load .env.local with higher priority', async () => {
  fse.outputFileSync(localFile, 'FOO=2');

  execSync('npx rsbuild build', {
    cwd: __dirname,
  });
  expect(fse.existsSync(path.join(__dirname, 'dist/2'))).toBeTruthy();
});

test('should load .env.production.local with higher priority', async () => {
  fse.outputFileSync(localFile, 'FOO=2');
  fse.outputFileSync(prodLocalFile, 'FOO=3');

  execSync('npx rsbuild build', {
    cwd: __dirname,
  });
  expect(fse.existsSync(path.join(__dirname, 'dist/3'))).toBeTruthy();
});
