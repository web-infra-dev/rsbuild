import fs from 'node:fs';
import path from 'node:path';
import { expectFile, rspackOnlyTest, runCli } from '@e2e/helper';
import { expect } from '@playwright/test';
import fse, { remove } from 'fs-extra';

rspackOnlyTest('should support watch mode for build command', async () => {
  const indexFile = path.join(__dirname, 'src/index.js');
  const distIndexFile = path.join(__dirname, 'dist/static/js/index.js');
  await remove(indexFile);
  await remove(distIndexFile);

  fse.outputFileSync(indexFile, `console.log('hello!');`);

  const childProcess = runCli('build --watch', {
    cwd: __dirname,
  });

  await expectFile(distIndexFile);
  expect(fs.readFileSync(distIndexFile, 'utf-8')).toContain('hello!');
  await remove(distIndexFile);

  fse.outputFileSync(indexFile, `console.log('hello2!');`);
  await expectFile(distIndexFile);
  expect(fs.readFileSync(distIndexFile, 'utf-8')).toContain('hello2!');

  childProcess.kill();
});
