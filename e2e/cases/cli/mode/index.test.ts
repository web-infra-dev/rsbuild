import path from 'node:path';
import { expect, readDirContents, rspackTest } from '@e2e/helper';

rspackTest(
  'should run build command with --mode option correctly',
  async ({ execCliSync }) => {
    execCliSync('build --mode development');

    const outputs = await readDirContents(path.join(__dirname, 'dist'));
    const outputFiles = Object.keys(outputs);

    // no filename hash in dev
    expect(
      outputFiles.find((item) => item.endsWith('static/js/index.js')),
    ).toBeTruthy();
    expect(
      outputFiles.find((item) => item.endsWith('static/js/index.js.map')),
    ).toBeTruthy();
  },
);

rspackTest(
  'should run build command with -m option correctly',
  async ({ execCliSync }) => {
    execCliSync('build -m development');

    const outputs = await readDirContents(path.join(__dirname, 'dist'));
    const outputFiles = Object.keys(outputs);

    // no filename hash in dev
    expect(
      outputFiles.find((item) => item.endsWith('static/js/index.js')),
    ).toBeTruthy();
    expect(
      outputFiles.find((item) => item.endsWith('static/js/index.js.map')),
    ).toBeTruthy();
  },
);
