import path from 'node:path';
import { expect, readDirContents, rspackTest } from '@e2e/helper';

rspackTest('should run allow to specify base path', async ({ execCliSync }) => {
  execCliSync('build --base /test');

  const outputs = await readDirContents(path.join(__dirname, 'dist'));
  const outputFiles = Object.keys(outputs);

  expect(
    outputFiles.find((item) =>
      outputs[item].includes('/test/static/js/index.'),
    ),
  ).toBeTruthy();
});
