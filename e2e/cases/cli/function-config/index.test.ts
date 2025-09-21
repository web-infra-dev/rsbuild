import path from 'node:path';
import { expect, readDirContents, rspackTest } from '@e2e/helper';
import { remove } from 'fs-extra';

rspackTest(
  'should support exporting a function from the config file',
  async ({ execCliSync }) => {
    const targetDir = path.join(__dirname, 'dist-production-build');

    await remove(targetDir);

    execCliSync('build');

    const outputs = await readDirContents(targetDir);
    const outputFiles = Object.keys(outputs);

    expect(outputFiles.length > 1).toBeTruthy();
  },
);
