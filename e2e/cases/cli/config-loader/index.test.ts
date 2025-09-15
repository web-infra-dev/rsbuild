import path from 'node:path';
import { expect, readDirContents, rspackTest, runCliSync } from '@e2e/helper';

rspackTest('should use Node.js native loader to load config', async () => {
  if (!process.features.typescript) {
    return;
  }

  runCliSync('build --config-loader native', {
    cwd: __dirname,
    env: {
      ...process.env,
      NODE_OPTIONS: '--experimental-strip-types',
    },
  });

  const outputs = await readDirContents(path.join(__dirname, 'dist-custom'));
  const outputFiles = Object.keys(outputs);

  expect(outputFiles.length > 1).toBeTruthy();
});
