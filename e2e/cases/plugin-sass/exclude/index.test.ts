import { expect, test } from '@e2e/helper';
import { findFiles } from '@rstackjs/test-utils';

test('should exclude specified Sass files using the exclude option', async ({
  build,
}) => {
  const rsbuild = await build({
    config: {
      tools: {
        bundlerChain(chain) {
          chain.module
            .rule('fallback')
            .test(/b\.scss$/)
            .type('asset/resource');
        },
      },
    },
  });

  const files = rsbuild.getDistFiles();
  const cssFiles = findFiles(files, '.css');
  const scssFiles = findFiles(files, '.scss');

  expect(scssFiles.length).toBe(1);
  expect(cssFiles.length).toBe(1);
});
