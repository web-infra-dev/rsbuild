import path from 'node:path';
import { expect, readDirContents, rspackTest, runCliSync } from '@e2e/helper';

rspackTest('should use custom config when using --config option', async () => {
  runCliSync('build --config ./custom.config.mjs', {
    cwd: __dirname,
  });

  const outputs = await readDirContents(path.join(__dirname, 'dist-custom'));
  const outputFiles = Object.keys(outputs);

  expect(outputFiles.length > 1).toBeTruthy();
});

rspackTest('should support custom config to find absolute path', async () => {
  const absPath = path.join(__dirname, 'custom.config.mjs');
  runCliSync(`build --config ${absPath}`, {
    cwd: __dirname,
  });
  const outputs = await readDirContents(path.join(__dirname, 'dist-custom'));
  const outputFiles = Object.keys(outputs);

  expect(outputFiles.length > 1).toBeTruthy();
});
