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
    const sourceCode = readFileSync(
      path.join(__dirname, 'src/index.ts'),
      'utf-8',
    );
    const outputCode =
      files[Object.keys(files).find((file) => file.endsWith('index.js'))!];
    const sourceMap =
      files[Object.keys(files).find((file) => file.endsWith('index.js.map'))!];

    const argsPosition = outputCode.indexOf('"args"');
    const helloPosition = outputCode.indexOf('"hello"');

    const originalPositions = await validateSourceMap(sourceMap, [
      {
        line: 1,
        column: argsPosition,
      },
      {
        line: 1,
        column: helloPosition,
      },
    ]);

    const sourceLines = sourceCode.split('\n');
    expect(originalPositions).toEqual([
      {
        source: 'webpack:///src/index.ts',
        line: 2,
        column: sourceLines[1].indexOf(`'args'`),
        name: null,
      },
      {
        source: 'webpack:///src/index.ts',
        line: 5,
        column: sourceLines[4].indexOf(`'hello'`),
        name: null,
      },
    ]);

    await rsbuild.close();
  },
);
