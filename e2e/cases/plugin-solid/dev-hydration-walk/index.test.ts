import { expect, test } from '@e2e/helper';
import { pluginSolid } from '@rsbuild/plugin-solid';
import { getFileContent } from '@rstackjs/test-utils';

for (const compiler of ['native', 'babel'] as const) {
  test(`should emit hydration walk helpers with ${compiler} when dev is true`, async ({
    build,
  }) => {
    const rsbuild = await build({
      config: {
        output: {
          minify: false,
        },
        splitChunks: {
          preset: 'none',
          cacheGroups: {
            'solid-runtime': {
              test: /node_modules[\\/]@solidjs[\\/]web[\\/]/,
              name: 'solid-runtime',
              chunks: 'all',
              enforce: true,
            },
          },
        },
        plugins: [
          pluginSolid({
            compiler,
            dev: true,
            refresh: { disabled: true },
            ssr: true,
          }),
        ],
      },
    });
    const content = getFileContent(rsbuild.getDistFiles(), 'index.js');

    expect(content).toContain('getFirstChild');
    expect(content).toContain('getNextSibling');
  });

  test(`should omit hydration walk helpers with ${compiler} when dev is false`, async ({
    devOnly,
  }) => {
    const rsbuild = await devOnly({
      config: {
        output: {
          minify: false,
        },
        splitChunks: {
          preset: 'none',
          cacheGroups: {
            'solid-runtime': {
              test: /node_modules[\\/]@solidjs[\\/]web[\\/]/,
              name: 'solid-runtime',
              chunks: 'all',
              enforce: true,
            },
          },
        },
        plugins: [
          pluginSolid({
            compiler,
            dev: false,
            refresh: { disabled: true },
            ssr: true,
          }),
        ],
      },
    });
    const content = getFileContent(rsbuild.getDistFiles(), 'index.js');

    expect(content).toContain('.firstChild');
    expect(content).toContain('.nextSibling');
    expect(content).not.toContain('getFirstChild');
    expect(content).not.toContain('getNextSibling');
  });
}
