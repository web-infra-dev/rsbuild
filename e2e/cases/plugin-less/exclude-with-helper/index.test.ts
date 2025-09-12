import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should exclude specified Less files using addExcludes', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      tools: {
        bundlerChain(chain) {
          chain.module
            .rule('fallback')
            .test(/b\.less$/)
            .type('asset/resource');
        },
      },
    },
  });

  const files = rsbuild.getDistFiles();
  const cssFiles = Object.keys(files).filter((file) => file.endsWith('.css'));
  const lessFiles = Object.keys(files).filter((file) => file.endsWith('.less'));

  expect(lessFiles.length).toBe(1);
  expect(cssFiles.length).toBe(1);
});
