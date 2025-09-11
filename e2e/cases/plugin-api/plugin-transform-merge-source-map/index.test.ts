import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  build,
  dev,
  getDistFiles,
  mapSourceMapPositions,
  rspackOnlyTest,
} from '@e2e/helper';
import { expect } from '@playwright/test';

const expectSourceMap = async (files: Record<string, string>) => {
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

  const positions = await mapSourceMapPositions(sourceMap, [
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
  expect(positions).toEqual([
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
};

rspackOnlyTest(
  'should merge source map when plugin transforms code in build',
  async () => {
    const rsbuild = await build({
      cwd: __dirname,
    });
    const files = await rsbuild.getDistFiles({ sourceMaps: true });

    await expectSourceMap(files);
    await rsbuild.close();
  },
);

rspackOnlyTest(
  'should merge source map when plugin transforms code in dev',
  async ({ page }) => {
    const rsbuild = await dev({
      cwd: __dirname,
      page,
    });
    const files = await getDistFiles(rsbuild.instance.context.distPath, true);

    await expectSourceMap(files);
    await rsbuild.close();
  },
);
