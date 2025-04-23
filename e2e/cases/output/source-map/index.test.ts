import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { build, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import type { Rspack } from '@rsbuild/core';
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
    rsbuildConfig: {
      output: {
        sourceMap: {
          js: devtool,
        },
        legalComments: 'none',
      },
    },
  });

  const files = await rsbuild.getDistFiles(false);
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
  });

  const files = await rsbuild.getDistFiles(false);

  const jsMapFiles = Object.keys(files).filter((files) =>
    files.endsWith('.js.map'),
  );
  const cssMapFiles = Object.keys(files).filter((files) =>
    files.endsWith('.css.map'),
  );
  expect(jsMapFiles.length).toEqual(0);
  expect(cssMapFiles.length).toEqual(0);
});

test('should generate source map if `output.sourceMap` is true', async () => {
  const rsbuild = await build({
    cwd: fixtures,
    rsbuildConfig: {
      output: {
        sourceMap: true,
      },
    },
  });

  const files = await rsbuild.getDistFiles(false);

  const jsMapFiles = Object.keys(files).filter((files) =>
    files.endsWith('.js.map'),
  );
  const cssMapFiles = Object.keys(files).filter((files) =>
    files.endsWith('.css.map'),
  );
  expect(jsMapFiles.length).toBeGreaterThan(0);
  expect(cssMapFiles.length).toBeGreaterThan(0);
});

test('should not generate source map if `output.sourceMap` is false', async () => {
  const rsbuild = await build({
    cwd: fixtures,
    rsbuildConfig: {
      output: {
        sourceMap: false,
      },
    },
  });

  const files = await rsbuild.getDistFiles(false);

  const jsMapFiles = Object.keys(files).filter((files) =>
    files.endsWith('.js.map'),
  );
  const cssMapFiles = Object.keys(files).filter((files) =>
    files.endsWith('.css.map'),
  );
  expect(jsMapFiles.length).toEqual(0);
  expect(cssMapFiles.length).toEqual(0);
});

test('should generate source map correctly in development build', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: fixtures,
    page,
  });

  const files = await rsbuild.getDistFiles(false);

  const jsMapFile = Object.keys(files).find((files) =>
    files.endsWith('.js.map'),
  );
  expect(jsMapFile).not.toBeUndefined();

  const jsContent = await readFileSync(jsMapFile!, 'utf-8');
  const jsMap = JSON.parse(jsContent);
  expect(jsMap.sources.length).toBeGreaterThan(1);
  expect(jsMap.file).toEqual('static/js/index.js');
  expect(jsMap.sourcesContent).toContain(
    readFileSync(join(fixtures, 'src/App.jsx'), 'utf-8'),
  );
  expect(jsMap.sourcesContent).toContain(
    readFileSync(join(fixtures, 'src/index.js'), 'utf-8'),
  );
  expect(jsMap.mappings).not.toBeUndefined();

  await rsbuild.close();
});

test('should allow to only generate source map for CSS files', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      output: {
        sourceMap: {
          js: false,
          css: true,
        },
      },
    },
  });

  const files = await rsbuild.getDistFiles(false);

  const jsMapFiles = Object.keys(files).filter((files) =>
    files.endsWith('.js.map'),
  );
  const cssMapFiles = Object.keys(files).filter((files) =>
    files.endsWith('.css.map'),
  );
  expect(jsMapFiles.length).toEqual(0);
  expect(cssMapFiles.length).toBeGreaterThan(0);
});
