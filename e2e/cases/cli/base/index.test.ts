import path from 'node:path';
import {
  expect,
  readDirContents,
  rspackOnlyTest,
  runCliSync,
} from '@e2e/helper';

rspackOnlyTest('should run allow to specify base path', async () => {
  runCliSync('build --base /test', {
    cwd: __dirname,
  });

  const outputs = await readDirContents(path.join(__dirname, 'dist'));
  const outputFiles = Object.keys(outputs);

  expect(
    outputFiles.find((item) =>
      outputs[item].includes('/test/static/js/index.'),
    ),
  ).toBeTruthy();
});
