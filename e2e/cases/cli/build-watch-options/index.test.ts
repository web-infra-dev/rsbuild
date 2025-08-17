import fs from 'node:fs';
import path from 'node:path';
import { expectFileWithContent, rspackOnlyTest, runCli } from '@e2e/helper';
import { expect } from '@playwright/test';
import fse, { remove } from 'fs-extra';

rspackOnlyTest(
  'should allow to custom watch options for build watch',
  async () => {
    const srcDir = path.join(__dirname, 'src');
    const tempDir = path.join(__dirname, 'test-temp-src');
    const distIndexFile = path.join(__dirname, 'dist/static/js/index.js');
    const fooFile = path.join(tempDir, 'foo.js');
    const barFile = path.join(tempDir, 'bar.js');

    // clean up
    await remove(tempDir);
    await remove(distIndexFile);
    await fse.copy(srcDir, tempDir);

    const { childProcess, close } = runCli('build --watch', {
      cwd: __dirname,
    });

    await expectFileWithContent(distIndexFile, 'foo1bar1');
    await remove(distIndexFile);

    // should watch foo.js
    fse.outputFileSync(fooFile, `export const foo = 'foo2';`);
    await expectFileWithContent(distIndexFile, 'foo2bar1');

    // should not watch bar.js
    fse.outputFileSync(barFile, `export const bar = 'bar2';`);
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(fs.readFileSync(distIndexFile, 'utf-8')).toContain('foo2bar1');

    close();
  },
);
