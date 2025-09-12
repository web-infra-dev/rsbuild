import path from 'node:path';
import {
  expect,
  readDirContents,
  rspackOnlyTest,
  runCliSync,
} from '@e2e/helper';

rspackOnlyTest(
  'should run build command with --mode option correctly',
  async () => {
    runCliSync('build --mode development', {
      cwd: __dirname,
    });

    const outputs = await readDirContents(path.join(__dirname, 'dist'));
    const outputFiles = Object.keys(outputs);

    // no filename hash in dev
    expect(
      outputFiles.find((item) => item.endsWith('static/js/index.js')),
    ).toBeTruthy();
    expect(
      outputFiles.find((item) => item.endsWith('static/js/index.js.map')),
    ).toBeTruthy();
  },
);

rspackOnlyTest(
  'should run build command with -m option correctly',
  async () => {
    runCliSync('build -m development', {
      cwd: __dirname,
    });

    const outputs = await readDirContents(path.join(__dirname, 'dist'));
    const outputFiles = Object.keys(outputs);

    // no filename hash in dev
    expect(
      outputFiles.find((item) => item.endsWith('static/js/index.js')),
    ).toBeTruthy();
    expect(
      outputFiles.find((item) => item.endsWith('static/js/index.js.map')),
    ).toBeTruthy();
  },
);
