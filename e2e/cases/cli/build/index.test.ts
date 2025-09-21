import path from 'node:path';
import { expect, readDirContents, rspackTest } from '@e2e/helper';

rspackTest('should run build command correctly', async ({ execCliSync }) => {
  execCliSync('build');

  const outputs = await readDirContents(path.join(__dirname, 'dist'));
  const outputFiles = Object.keys(outputs);

  expect(outputFiles.find((item) => item.includes('index.html'))).toBeTruthy();
  expect(
    outputFiles.find((item) => item.includes('static/js/index.')),
  ).toBeTruthy();
});
