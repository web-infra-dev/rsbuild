import { basename } from 'node:path';
import { expect, test } from '@e2e/helper';
import { findFile, getFileContent } from '@rstackjs/test-utils';

test.for([
  ['object', true],
  ['array', false],
] as const)(
  'should inherit %s CSS URL minimizer options with removeUnusedLocalIdents=%s',
  async ([type, removeUnusedLocalIdents], { build }) => {
    const options = {
      removeUnusedLocalIdents,
      minimizerOptions: {
        unusedSymbols: ['unused'],
        pseudoClasses: { hover: 'minimizer-hover' },
      },
    };
    const rsbuild = await build({
      config: {
        environments: {
          web: {
            output: {
              minify: {
                cssOptions: type === 'array' ? [options] : options,
              },
            },
          },
        },
      },
    });
    const files = rsbuild.getDistFiles();
    const webCss = findFile(files, '/web/static/css/style.css');
    const nodeCss = findFile(files, '/node/static/css/style.css');

    expect(basename(webCss)).toBe(basename(nodeCss));
    expect(files[webCss]).toBe(files[nodeCss]);
    expect(files[webCss]).not.toContain('.unused');
    expect(files[webCss]).not.toContain('.loader-unused');
    expect(files[webCss]).toContain('.minimizer-hover');
    expect(files[webCss]).not.toContain('.loader-hover');
    expect(files[webCss]).toContain('.loader-focus');
  },
);

test.for(['test', 'include', 'exclude', 'array'] as const)(
  'should preserve CSS URL minimizer asset matching with %s',
  async (type, { build }) => {
    const minimizerOptions = { unusedSymbols: ['unused'] };
    const cssOptions =
      type === 'array'
        ? [
            { include: /\/style\./, minimizerOptions },
            {
              include: /\/other\./,
              minimizerOptions: { unusedSymbols: ['keep'] },
            },
          ]
        : {
            [type]: type === 'exclude' ? /\/other\./ : /\/style\./,
            minimizerOptions,
          };
    const rsbuild = await build({
      config: {
        environments: {
          web: {
            output: { minify: { cssOptions } },
          },
        },
      },
    });
    const files = rsbuild.getDistFiles();
    const style = getFileContent(files, '/web/static/css/style.css');
    const other = getFileContent(files, '/web/static/css/other.css');

    expect(style).not.toContain('.unused');
    expect(other).toContain('.unused');
    expect(other.includes('.keep')).toBe(type !== 'array');
  },
);

test('should not inherit CSS URL minimizer options when CSS minification is disabled', async ({
  build,
}) => {
  const rsbuild = await build({
    config: {
      output: {
        minify: {
          css: false,
          cssOptions: { minimizerOptions: { unusedSymbols: ['unused'] } },
        },
      },
    },
  });
  const files = rsbuild.getDistFiles();

  expect(getFileContent(files, '/web/static/css/style.css')).toContain(
    '.unused',
  );
  expect(getFileContent(files, '/node/static/css/style.css')).toContain(
    '.unused',
  );
});
