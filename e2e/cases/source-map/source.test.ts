import { join } from 'path';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';
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

test('source-map', async () => {
  const rsbuild = await build({
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.js'),
    },
    builderConfig: {
      output: {
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
    source: o.source!.split('webpack-builder-source-map/')[1] || o.source,
  }));

  expect(originalPositions[0]).toEqual({
    source: 'src/App.jsx',
    line: 2,
    column: 24,
    name: null,
  });

  expect(originalPositions[1]).toEqual({
    source: 'src/index.js',
    line: 6,
    column: 0,
    name: 'window',
  });
});
