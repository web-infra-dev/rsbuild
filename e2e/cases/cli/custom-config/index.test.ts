import path from 'node:path';
import {
  expect,
  readDirContents,
  rspackOnlyTest,
  runCliSync,
} from '@e2e/helper';

rspackOnlyTest(
  'should use custom config when using --config option',
  async () => {
    runCliSync('build --config ./custom.config.mjs', {
      cwd: __dirname,
    });

    const outputs = await readDirContents(path.join(__dirname, 'dist-custom'));
    const outputFiles = Object.keys(outputs);

    expect(outputFiles.length > 1).toBeTruthy();
  },
);

rspackOnlyTest(
  'should support custom config to find absolute path',
  async () => {
    const absPath = path.join(__dirname, 'custom.config.mjs');
    runCliSync(`build --config ${absPath}`, {
      cwd: __dirname,
    });
    const outputs = await readDirContents(path.join(__dirname, 'dist-custom'));
    const outputFiles = Object.keys(outputs);

    expect(outputFiles.length > 1).toBeTruthy();
  },
);
