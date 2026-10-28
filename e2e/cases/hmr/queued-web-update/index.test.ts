import { join } from 'node:path';
import { expect, test } from '@e2e/helper';
import type { Rspack } from '@rsbuild/core';

test('should apply a queued web update before Node finishes', async ({
  page,
  dev,
  cwd,
}) => {
  const compilers: Rspack.Compiler[] = [];
  const webBuilding = Promise.withResolvers<void>();
  const releaseWeb = Promise.withResolvers<void>();
  const releaseNode = Promise.withResolvers<void>();
  const rebuild = () => {
    for (const compiler of compilers) {
      compiler.watching!.invalidate();
    }
  };

  await dev({
    config: {
      environments: {
        web: {},
        node: {
          source: { entry: { server: './src/server.js' } },
          output: { target: 'node' },
        },
      },
      tools: {
        rspack: (config, { environment }) => {
          if (environment.name === 'web') {
            config.module.rules ??= [];
            config.module.rules.push({
              test: /index\.js$/,
              use: join(cwd, 'build-number-loader.mjs'),
            });
          }
          config.plugins.push({
            apply(compiler: Rspack.Compiler) {
              compilers.push(compiler);
              let builds = 0;
              compiler.hooks.afterCompile.tapPromise(
                'pause-build',
                async () => {
                  if (++builds === 1) return;
                  if (environment.name === 'node') {
                    await releaseNode.promise;
                  } else if (builds === 2) {
                    webBuilding.resolve();
                    await releaseWeb.promise;
                  }
                },
              );
            },
          });
        },
      },
    },
  });

  const root = page.locator('#root');
  await expect(root).toHaveText('1');
  await page.evaluate(() => {
    document.body.dataset.hmr = 'preserved';
  });

  try {
    rebuild();
    await webBuilding.promise;
    // Queue another rebuild before the current Web compilation reaches `done`.
    rebuild();
    releaseWeb.resolve();

    // Both updates must apply while Node is paused, without falling back to a reload.
    await expect(root).toHaveText('3');
    await expect(page.locator('body')).toHaveAttribute('data-hmr', 'preserved');
  } finally {
    releaseWeb.resolve();
    releaseNode.resolve();
  }
});
