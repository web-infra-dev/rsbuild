import { join } from 'node:path';
import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to use tools.bundlerChain to set alias config', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      tools: {
        bundlerChain: (chain) => {
          chain.resolve.alias.merge({
            '@common': join(__dirname, 'src/common'),
          });
        },
      },
    },
  });

  await expect(page.innerHTML('#test')).resolves.toBe('Hello Rsbuild! 1');

  await rsbuild.close();
});

test('should allow to use async tools.bundlerChain to set alias config', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      tools: {
        bundlerChain: async (chain) => {
          return new Promise((resolve) => {
            setTimeout(() => {
              chain.resolve.alias.merge({
                '@common': join(__dirname, 'src/common'),
              });
              resolve();
            }, 0);
          });
        },
      },
    },
  });

  await expect(page.innerHTML('#test')).resolves.toBe('Hello Rsbuild! 1');

  await rsbuild.close();
});
