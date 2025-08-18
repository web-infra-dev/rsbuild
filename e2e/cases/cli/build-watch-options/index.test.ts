import path from 'node:path';
import { expectFileWithContent, rspackOnlyTest, runCli } from '@e2e/helper';
import { expect } from '@playwright/test';
import fse from 'fs-extra';

rspackOnlyTest(
  'should allow to custom watch options for build watch',
  async () => {
    const srcDir = path.join(__dirname, 'src');
    const tempDir = path.join(__dirname, 'test-temp-src');
    const distIndexFile = path.join(__dirname, 'dist/static/js/index.js');
    const fooFile = path.join(tempDir, 'foo.js');
    const barFile = path.join(tempDir, 'bar.js');

    await fse.copy(srcDir, tempDir);

    const { logs, close, expectLog, expectBuildEnd, clearLogs } = runCli(
      'build --watch',
      {
        cwd: __dirname,
      },
    );

    await expectBuildEnd();
    await expectFileWithContent(distIndexFile, 'foo1bar1');
    clearLogs();

    // should watch foo.js
    fse.outputFileSync(fooFile, `export const foo = 'foo2';`);
    await expectLog(/building test-temp-src[\\/]foo.js/);
    await expectBuildEnd();
    await expectFileWithContent(distIndexFile, 'foo2bar1');

    // should not watch bar.js
    fse.outputFileSync(barFile, `export const bar = 'bar2';`);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(
      logs.some((log) => /building test-temp-src[\\/]bar.js/.test(log)),
    ).toBeFalsy();

    close();
  },
);
