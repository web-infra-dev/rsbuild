import {
  type Build,
  expect,
  getFileContent,
  mapSourceMapPositions,
  test,
} from '@e2e/helper';

const getGeneratedPosition = (code: string, search: string) => {
  const offset = code.indexOf(search);

  if (offset === -1) {
    throw new Error(`Failed to find "${search}" in generated output.`);
  }

  const before = code.slice(0, offset);
  const lines = before.split('\n');

  return {
    line: lines.length,
    column: lines[lines.length - 1].length,
  };
};

async function buildWithExtract(
  build: Build,
  extract:
    | boolean
    | { js?: boolean | { include?: RegExp[]; exclude?: RegExp[] } },
) {
  return build({
    config: {
      output: {
        filenameHash: false,
        minify: false,
        sourceMap: {
          js: 'source-map',
          extract,
        },
      },
    },
  });
}

test('should preserve JavaScript source maps from matched files', async ({
  build,
}) => {
  const rsbuild = await buildWithExtract(build, { js: true });
  const files = rsbuild.getDistFiles({ sourceMaps: true });

  const outputCode = getFileContent(files, 'index.js');
  const sourceMap = getFileContent(files, 'index.js.map');
  const generatedPosition = getGeneratedPosition(outputCode, 'from-package-ts');

  const [originalPosition] = await mapSourceMapPositions(sourceMap, [
    generatedPosition,
  ]);

  expect(originalPosition.source).toContain(
    'node_modules/mapped-package/index.ts',
  );
});

test('should preserve JavaScript source maps when extract is true', async ({
  build,
}) => {
  const rsbuild = await buildWithExtract(build, true);
  const files = rsbuild.getDistFiles({ sourceMaps: true });

  const jsOutput = getFileContent(files, 'index.js');
  const jsSourceMap = getFileContent(files, 'index.js.map');

  const [jsPosition] = await mapSourceMapPositions(jsSourceMap, [
    getGeneratedPosition(jsOutput, 'from-package-ts'),
  ]);

  expect(jsPosition.source).toContain('node_modules/mapped-package/index.ts');
});
