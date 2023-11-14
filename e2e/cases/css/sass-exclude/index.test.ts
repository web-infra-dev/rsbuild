import path from 'path';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';

test('should exclude specified scss file', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    rsbuildConfig: {
      tools: {
        sass: (_, { addExcludes }) => {
          addExcludes([/b\.scss$/]);
        },
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
