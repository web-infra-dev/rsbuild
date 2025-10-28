import { expect, findFile, test } from '@e2e/helper';

test('should generate source map for multiple environments', async ({
  build,
}) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles({ sourceMaps: true });

  const web1JsMapPath = findFile(
    files,
    (path) => path.includes('static/js/index.js.map') && !path.includes('web2'),
  );
  const web2JsMapPath = findFile(files, 'web2/static/js/index.js.map');

  expect(JSON.parse(files[web1JsMapPath])).toEqual({
    version: 3,
    file: 'static/js/index.js',
    sources: ['../../../src/index.js'],
    sourcesContent: ["console.log('hello');\n"],
    names: ['console'],
    // cspell:disable-next-line
    mappings: 'AAAAA,QAAQ,GAAG,CAAC',
  });
  expect(JSON.parse(files[web2JsMapPath])).toEqual({
    version: 3,
    file: 'static/js/index.js',
    sources: ['../../../../../src/index.js'],
    sourcesContent: ["console.log('hello');\n"],
    names: ['console'],
    // cspell:disable-next-line
    mappings: 'AAAAA,QAAQ,GAAG,CAAC',
  });
});
