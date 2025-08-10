import path from 'node:path';
import { readDirContents, rspackOnlyTest, runCliSync } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should run build command with --root option correctly',
  async () => {
    runCliSync('build --root test', {
      cwd: __dirname,
    });

    const outputs = await readDirContents(path.join(__dirname, 'test', 'dist'));
    const outputFiles = Object.keys(outputs);

    expect(
      outputFiles.find((item) => item.endsWith('static/js/index.js')),
    ).toBeTruthy();
  },
);

rspackOnlyTest(
  'should run build command with -r option correctly',
  async () => {
    runCliSync('build -r test', {
      cwd: __dirname,
    });

    const outputs = await readDirContents(path.join(__dirname, 'test', 'dist'));
    const outputFiles = Object.keys(outputs);

    expect(
      outputFiles.find((item) => item.endsWith('static/js/index.js')),
    ).toBeTruthy();
  },
);
