import { readFileSync } from 'node:fs';
import path from 'node:path';
import { build, rspackOnlyTest, validateSourceMap } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should merge source map when plugin transforms code',
  async () => {
    const rsbuild = await build({
      cwd: __dirname,
    });

    const files = await rsbuild.getDistFiles(false);
    const srcIndexTs = readFileSync(
      path.join(__dirname, 'src/index.ts'),
      'utf-8',
    );
    const distIndexJs =
      files[Object.keys(files).find((file) => file.endsWith('index.js'))!];
    const distIndexJsMap =
      files[Object.keys(files).find((file) => file.endsWith('index.js.map'))!];

    const index1 = distIndexJs.indexOf('"args"');
    const index2 = distIndexJs.indexOf('"hello"');

    const originalPositions = await validateSourceMap(distIndexJsMap, [
      {
        line: 1,
        column: index1,
      },
      {
        line: 1,
        column: index2,
      },
    ]);

    const srcLines = srcIndexTs.split('\n');
    expect(originalPositions).toEqual([
      {
        source: 'webpack:///src/index.ts',
        line: 2,
        column: srcLines[1].indexOf(`'args'`),
        name: null,
      },
      {
        source: 'webpack:///src/index.ts',
        line: 5,
        column: srcLines[4].indexOf(`'hello'`),
        name: null,
      },
    ]);

    await rsbuild.close();
  },
);
