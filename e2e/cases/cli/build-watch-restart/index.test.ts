import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { expectFile, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import fse, { remove } from 'fs-extra';

rspackOnlyTest('should support restart build when config changed', async () => {
  const indexFile = path.join(__dirname, 'src/index.js');
  const distIndexFile = path.join(__dirname, 'dist/static/js/index.js');
  await remove(indexFile);
  await remove(distIndexFile);
  const tempConfigFile = path.join(__dirname, 'test-temp-rsbuild.config.mjs');

  fse.outputFileSync(
    tempConfigFile,
    `export default {
  output: {
    filenameHash: false,
  },
};
`,
  );

  fse.outputFileSync(indexFile, `console.log('hello!');`);

  const childProcess = exec(`npx rsbuild build --watch -c ${tempConfigFile}`, {
    cwd: __dirname,
  });

  await expectFile(distIndexFile);
  expect(fs.readFileSync(distIndexFile, 'utf-8')).toContain('hello!');
  await remove(distIndexFile);

  fse.outputFileSync(
    tempConfigFile,
    `export default {
  // update
  output: {
    filenameHash: false,
  },
};
`,
  );

  await expectFile(distIndexFile);
  expect(fs.readFileSync(distIndexFile, 'utf-8')).toContain('hello!');
  await remove(distIndexFile);

  fse.outputFileSync(indexFile, `console.log('hello2!');`);
  await expectFile(distIndexFile);
  expect(fs.readFileSync(distIndexFile, 'utf-8')).toContain('hello2!');

  childProcess.kill();
});
