import path from 'node:path';
import {
  expect,
  readDirContents,
  rspackOnlyTest,
  runCliSync,
} from '@e2e/helper';

rspackOnlyTest(
  'should set NODE_ENV correctly when running build command',
  async () => {
    delete process.env.NODE_ENV;
    runCliSync('build', {
      cwd: __dirname,
    });

    const outputs = await readDirContents(path.join(__dirname, 'dist-prod'));
    const outputFiles = Object.keys(outputs);

    expect(outputFiles.length > 1).toBeTruthy();
  },
);
