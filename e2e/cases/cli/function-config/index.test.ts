import path from 'node:path';
import {
  expect,
  readDirContents,
  rspackOnlyTest,
  runCliSync,
} from '@e2e/helper';
import { remove } from 'fs-extra';

rspackOnlyTest(
  'should support exporting a function from the config file',
  async () => {
    const targetDir = path.join(__dirname, 'dist-production-build');

    await remove(targetDir);

    delete process.env.NODE_ENV;
    runCliSync('build', {
      cwd: __dirname,
    });

    const outputs = await readDirContents(targetDir);
    const outputFiles = Object.keys(outputs);

    expect(outputFiles.length > 1).toBeTruthy();
  },
);
