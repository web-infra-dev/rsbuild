import path from 'node:path';
import { expect, readDirContents, rspackTest } from '@e2e/helper';

rspackTest(
  'should set NODE_ENV correctly when running build command',
  async ({ execCliSync }) => {
    delete process.env.NODE_ENV;
    execCliSync('build');

    const outputs = await readDirContents(path.join(__dirname, 'dist-prod'));
    const outputFiles = Object.keys(outputs);

    expect(outputFiles.length > 1).toBeTruthy();
  },
);
