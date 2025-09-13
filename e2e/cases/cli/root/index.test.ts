import path from 'node:path';
import { expect, readDirContents, rspackTest, runCliSync } from '@e2e/helper';

rspackTest(
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

rspackTest('should run build command with -r option correctly', async () => {
  runCliSync('build -r test', {
    cwd: __dirname,
  });

  const outputs = await readDirContents(path.join(__dirname, 'test', 'dist'));
  const outputFiles = Object.keys(outputs);

  expect(
    outputFiles.find((item) => item.endsWith('static/js/index.js')),
  ).toBeTruthy();
});
