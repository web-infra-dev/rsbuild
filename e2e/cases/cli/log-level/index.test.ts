import { execSync } from 'node:child_process';
import { stripVTControlCharacters as stripAnsi } from 'node:util';
import { rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should run build command with log level: info', async () => {
  const result = stripAnsi(
    execSync('npx rsbuild build --logLevel info', {
      cwd: __dirname,
    }).toString(),
  );

  expect(result).toContain('Rsbuild v');
  expect(result).toContain('build started...');
  expect(result).toContain('built in');
});

rspackOnlyTest('should run build command with log level: warn', async () => {
  const result = stripAnsi(
    execSync('npx rsbuild build --logLevel warn', {
      cwd: __dirname,
    }).toString(),
  );

  expect(result).not.toContain('Rsbuild v');
  expect(result).not.toContain('build started...');
  expect(result).not.toContain('built in');
});
