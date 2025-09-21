import path from 'node:path';
import { expect, readDirContents, rspackTest } from '@e2e/helper';

rspackTest(
  'should run build command with --root option correctly',
  async ({ execCliSync }) => {
    execCliSync('build --root test');

    const outputs = await readDirContents(path.join(__dirname, 'test', 'dist'));
    const outputFiles = Object.keys(outputs);

    expect(
      outputFiles.find((item) => item.endsWith('static/js/index.js')),
    ).toBeTruthy();
  },
);

rspackTest(
  'should run build command with -r option correctly',
  async ({ execCliSync }) => {
    execCliSync('build -r test');

    const outputs = await readDirContents(path.join(__dirname, 'test', 'dist'));
    const outputFiles = Object.keys(outputs);

    expect(
      outputFiles.find((item) => item.endsWith('static/js/index.js')),
    ).toBeTruthy();
  },
);
