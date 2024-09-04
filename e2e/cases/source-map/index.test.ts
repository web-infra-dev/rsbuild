import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import type { Rspack } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

import sourceMap from 'source-map';

const fixtures = __dirname;

async function validateSourceMap(
  rawSourceMap: string,
  generatedPositions: {
    line: number;
    column: number;
  }[],
) {
  const consumer = await new sourceMap.SourceMapConsumer(rawSourceMap);

  const originalPositions = generatedPositions.map((generatedPosition) =>
    consumer.originalPositionFor({
      line: generatedPosition.line,
      column: generatedPosition.column,
    }),
  );

  consumer.destroy();
  return originalPositions;
}

async function testSourceMapType(devtool: Rspack.Configuration['devtool']) {
  const rsbuild = await build({
    cwd: fixtures,
    plugins: [pluginReact()],
    rsbuildConfig: {
      dev: {
        writeToDisk: true,
      },
      output: {
        sourceMap: {
          js: devtool,
        },
        legalComments: 'none',
      },
      performance: {
        chunkSplit: {
          strategy: 'all-in-one',
        },
      },
    },
  });

  const files = await rsbuild.unwrapOutputJSON(false);
  const [, jsMapContent] = Object.entries(files).find(
    ([name]) => name.includes('static/js/') && name.endsWith('.js.map'),
  )!;

  const [, jsContent] = Object.entries(files).find(
    ([name]) => name.includes('static/js/') && name.endsWith('.js'),
  )!;

  const AppContentIndex = jsContent.indexOf('Hello Rsbuild!');
  const indexContentIndex = jsContent.indexOf('window.aa');

  const originalPositions = (
    await validateSourceMap(jsMapContent, [
      {
        line: 1,
        column: AppContentIndex,
      },
      {
        line: 1,
        column: indexContentIndex,
      },
    ])
  ).map((o) => ({
    ...o,
    source: o.source!.split('source-map/')[1] || o.source,
  }));

  expect(originalPositions[0]).toEqual({
    source: 'src/App.jsx',
    line: 2,
    column: 24,
    name: null,
  });

  expect(originalPositions[1]).toEqual({
    source: 'src/index.js',
    line: 7,
    column: 0,
    name: 'window',
  });
}

const productionDevtools: Rspack.Configuration['devtool'][] = [
  'source-map',
  'nosources-source-map',
  'hidden-nosources-source-map',
  'hidden-source-map',
];

for (const devtool of productionDevtools) {
  test(`should generate correct "${devtool}" source map in production build`, async () => {
    await testSourceMapType(devtool);
  });
}

test('should not generate source map by default in production build', async () => {
  const rsbuild = await build({
    cwd: fixtures,
    plugins: [pluginReact()],
  });

  const files = await rsbuild.unwrapOutputJSON(false);

  const jsMapFiles = Object.keys(files).filter((files) =>
    files.endsWith('.js.map'),
  );
  const cssMapFiles = Object.keys(files).filter((files) =>
    files.endsWith('.css.map'),
  );
  expect(jsMapFiles.length).toEqual(0);
  expect(cssMapFiles.length).toEqual(0);
});
