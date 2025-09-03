import { readFileSync } from 'node:fs';
import path, { join } from 'node:path';
import { build, dev, mapSourceMapPositions } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import type { Rspack } from '@rsbuild/core';

const fixtures = __dirname;

async function testSourceMapType(devtool: Rspack.Configuration['devtool']) {
  const rsbuild = await build({
    cwd: fixtures,
    rsbuildConfig: {
      output: {
        sourceMap: {
          js: devtool,
        },
        legalComments: 'none',
        filenameHash: false,
      },
    },
  });

  const files = await rsbuild.getDistFiles({ sourceMaps: true });

  const indexSourceCode = readFileSync(
    path.join(__dirname, 'src/index.js'),
    'utf-8',
  );
  const appSourceCode = readFileSync(
    path.join(__dirname, 'src/App.jsx'),
    'utf-8',
  );
  const outputCode =
    files[Object.keys(files).find((file) => file.endsWith('index.js'))!];
  const sourceMap =
    files[Object.keys(files).find((file) => file.endsWith('index.js.map'))!];

  const AppContentIndex = outputCode.indexOf('Hello Rsbuild!');
  const indexContentIndex = outputCode.indexOf('window.test');

  const positions = (
    await mapSourceMapPositions(sourceMap, [
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
    source: o.source?.split('source-map/')[1] || o.source,
  }));

  expect(positions).toEqual([
    {
      source: 'src/App.jsx',
      line: 2,
      column: appSourceCode.split('\n')[1].indexOf('Hello Rsbuild!'),
      name: null,
    },
    {
      source: 'src/index.js',
      line: 7,
      column: indexSourceCode.split('\n')[6].indexOf('window'),
      name: 'window',
    },
  ]);
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

  const files = await rsbuild.getDistFiles({ sourceMaps: true });

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

  const files = await rsbuild.getDistFiles({ sourceMaps: true });

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

  const files = await rsbuild.getDistFiles({ sourceMaps: true });

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

  const files = await rsbuild.getDistFiles({ sourceMaps: true });

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

  const files = await rsbuild.getDistFiles({ sourceMaps: true });

  const jsMapFiles = Object.keys(files).filter((files) =>
    files.endsWith('.js.map'),
  );
  const cssMapFiles = Object.keys(files).filter((files) =>
    files.endsWith('.css.map'),
  );
  expect(jsMapFiles.length).toEqual(0);
  expect(cssMapFiles.length).toBeGreaterThan(0);
});
