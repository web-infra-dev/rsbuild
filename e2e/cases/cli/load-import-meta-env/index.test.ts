import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { fse } from '@rsbuild/shared';

const localFile = path.join(__dirname, '.env.local');
const prodLocalFile = path.join(__dirname, '.env.production.local');

test.beforeEach(() => {
  fs.rmSync(localFile, { force: true });
  fs.rmSync(prodLocalFile, { force: true });
});

test('should load .env config and allow rsbuild.config.ts to read env vars', async () => {
  execSync('npx rsbuild build', {
    cwd: __dirname,
  });
  expect(fs.existsSync(path.join(__dirname, 'dist/1'))).toBeTruthy();
});

test('should load .env.local with higher priority', async () => {
  fse.outputFileSync(localFile, 'FOO=2');

  execSync('npx rsbuild build', {
    cwd: __dirname,
  });
  expect(fs.existsSync(path.join(__dirname, 'dist/2'))).toBeTruthy();
});

test('should load .env.production.local with higher priority', async () => {
  fse.outputFileSync(localFile, 'FOO=2');
  fse.outputFileSync(prodLocalFile, 'FOO=3');

  execSync('npx rsbuild build', {
    cwd: __dirname,
  });
  expect(fs.existsSync(path.join(__dirname, 'dist/3'))).toBeTruthy();
});

test('should allow to specify env mode via --env-mode', async () => {
  execSync('npx rsbuild build --env-mode test', {
    cwd: __dirname,
  });

  expect(fs.existsSync(path.join(__dirname, 'dist/5'))).toBeTruthy();
});
