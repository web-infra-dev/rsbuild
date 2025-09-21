import path from 'node:path';
import { expect, readDirContents, rspackTest } from '@e2e/helper';

rspackTest(
  'should use Node.js native loader to load config',
  async ({ execCliSync }) => {
    if (!process.features.typescript) {
      return;
    }

    execCliSync('build --config-loader native', {
      env: {
        NODE_OPTIONS: '--experimental-strip-types',
      },
    });

    const outputs = await readDirContents(path.join(__dirname, 'dist-custom'));
    const outputFiles = Object.keys(outputs);

    expect(outputFiles.length > 1).toBeTruthy();
  },
);

rspackTest(
  'should fallback to jiti when config loader set to auto',
  async ({ execCliSync }) => {
    execCliSync('build --config-loader auto --config rsbuild.config.auto.mts', {
      env: {
        NODE_OPTIONS: '--experimental-strip-types',
      },
    });

    const outputs = await readDirContents(path.join(__dirname, 'dist-auto'));
    const outputFiles = Object.keys(outputs);

    expect(outputFiles.length > 1).toBeTruthy();
  },
);
