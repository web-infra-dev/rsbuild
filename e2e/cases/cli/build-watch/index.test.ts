import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { awaitFileExists } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import fse from 'fs-extra';

test('should support watch mode for build command', async () => {
  const indexFile = path.join(__dirname, 'src/index.js');
  const distIndexFile = path.join(__dirname, 'dist/static/js/index.js');
  fs.rmSync(indexFile, { force: true });
  fs.rmSync(distIndexFile, { force: true });

  fse.outputFileSync(indexFile, `console.log('hello!');`);

  const process = exec('npx rsbuild build --watch', {
    cwd: __dirname,
  });

  await awaitFileExists(distIndexFile);
  expect(fs.readFileSync(distIndexFile, 'utf-8')).toContain('hello!');
  fs.rmSync(distIndexFile, { force: true });

  fse.outputFileSync(indexFile, `console.log('hello2!');`);
  await awaitFileExists(distIndexFile);
  expect(fs.readFileSync(distIndexFile, 'utf-8')).toContain('hello2!');

  process.kill();
});
