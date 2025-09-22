import path from 'node:path';
import { expect, readDirContents, rspackTest } from '@e2e/helper';

rspackTest(
  'should use custom config when using --config option',
  async ({ execCliSync }) => {
    execCliSync('build --config ./custom.config.mjs');

    const outputs = await readDirContents(path.join(__dirname, 'dist-custom'));
    const outputFiles = Object.keys(outputs);

    expect(outputFiles.length > 1).toBeTruthy();
  },
);

rspackTest(
  'should support custom config to find absolute path',
  async ({ execCliSync }) => {
    const absPath = path.join(__dirname, 'custom.config.mjs');
    execCliSync(`build --config ${absPath}`);
    const outputs = await readDirContents(path.join(__dirname, 'dist-custom'));
    const outputFiles = Object.keys(outputs);

    expect(outputFiles.length > 1).toBeTruthy();
  },
);
