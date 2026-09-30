import { basename } from 'node:path';
import { expect, test } from '@e2e/helper';
import { findFile, getFileContent } from '@rstackjs/test-utils';

test.for([true, false])(
  'should inherit CSS URL minimizer options only when minify.css=%s',
  async (css, { build }) => {
    const cssOptions = {
      removeUnusedLocalIdents: true,
      minimizerOptions: {
        targets: { chrome: '120.0.0' },
        unusedSymbols: ['unused'],
      },
    };
    const rsbuild = await build({
      config: {
        environments: {
          web: {
            output: {
              minify: {
                css,
                cssOptions,
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
    expect(files[webCss].includes('.unused')).toBe(!css);
    expect(files[webCss].includes('-webkit-user-select')).toBe(!css);
    expect(files[webCss]).not.toContain('.loader-unused');
  },
);

test.for([false, true])(
  'should preserve CSS URL asset filtering with multiple minimizers=%s',
  async (multiple, { build }) => {
    const options = {
      include: /\/style\./,
      minimizerOptions: { unusedSymbols: ['unused'] },
    };
    const cssOptions = multiple
      ? [
          options,
          {
            include: /\/other\./,
            minimizerOptions: { unusedSymbols: ['keep'] },
          },
        ]
      : options;
    const rsbuild = await build({
      config: {
        environments: {
          web: {
            output: {
              minify: {
                cssOptions,
              },
            },
          },
        },
      },
    });
    const files = rsbuild.getDistFiles();
    const other = getFileContent(files, '/web/static/css/other.css');

    expect(getFileContent(files, '/web/static/css/style.css')).not.toContain(
      '.unused',
    );
    expect(other).toContain('.unused');
    expect(other.includes('.keep')).toBe(!multiple);
  },
);
