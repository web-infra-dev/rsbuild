import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('exclude specified sass file with exclude option', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
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

  const files = await rsbuild.unwrapOutputJSON();
  const cssFiles = Object.keys(files).filter((file) => file.endsWith('.css'));
  const scssFiles = Object.keys(files).filter((file) => file.endsWith('.scss'));

  expect(scssFiles.length).toBe(1);
  expect(cssFiles.length).toBe(1);
});
