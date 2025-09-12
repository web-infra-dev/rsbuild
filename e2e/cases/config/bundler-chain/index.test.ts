import { join } from 'node:path';
import { expect, rspackOnlyTest, test } from '@e2e/helper';

test('should allow to use tools.bundlerChain to set alias config', async ({
  page,
  build,
}) => {
  await build({
    rsbuildConfig: {
      tools: {
        bundlerChain: (chain) => {
          chain.resolve.alias.set('@common', join(__dirname, 'src/common'));
        },
      },
    },
  });

  await expect(page.innerHTML('#test')).resolves.toBe('Hello Rsbuild! 1');
});

test('should allow to use async tools.bundlerChain to set alias config', async ({
  page,
  build,
}) => {
  await build({
    rsbuildConfig: {
      tools: {
        bundlerChain: async (chain) => {
          return new Promise((resolve) => {
            setTimeout(() => {
              chain.resolve.alias.set('@common', join(__dirname, 'src/common'));
              resolve();
            }, 0);
          });
        },
      },
    },
  });

  await expect(page.innerHTML('#test')).resolves.toBe('Hello Rsbuild! 1');
});

rspackOnlyTest(
  'should allow to use rspack in tools.bundlerChain',
  async ({ page, build }) => {
    await build({
      rsbuildConfig: {
        tools: {
          bundlerChain: (chain, { rspack }) => {
            chain.resolve.alias.set('@common', join(__dirname, 'src/common'));

            chain.plugin('extra-define').use(rspack.DefinePlugin, [
              {
                ENABLE_TEST: JSON.stringify(true),
              },
            ]);
          },
        },
      },
    });

    const testEl = page.locator('#test-define');
    await expect(testEl).toHaveText('aaaaa');
  },
);
