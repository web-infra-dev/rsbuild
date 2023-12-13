import { pluginSplitChunks } from '@rsbuild/core/plugins/splitChunks';
import { pluginLazyCompilation } from '../src/webpack/plugins/lazyCompilation';
import { createStubRsbuild } from '../../webpack/tests/helper';

describe('plugin-lazy-compilation', () => {
  it('should allow to use lazy compilation', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [
        pluginLazyCompilation({
          entries: false,
          imports: true,
        }),
      ],
    });

    const config = await rsbuild.unwrapWebpackConfig();
    expect(config).toEqual({
      experiments: {
        lazyCompilation: {
          entries: false,
          imports: true,
        },
      },
      optimization: {
        splitChunks: false,
      },
    });
  });

  it('should disable split chunks', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginSplitChunks(), pluginLazyCompilation(true)],
    });

    const config = await rsbuild.unwrapWebpackConfig();
    expect(config.optimization?.splitChunks).toEqual(false);
  });

  it('should not apply lazy compilation in production', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      plugins: [pluginLazyCompilation(true)],
    });

    const config = await rsbuild.unwrapWebpackConfig();
    expect(config).toEqual({});

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should not apply lazy compilation for node target', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginLazyCompilation(true)],
      rsbuildConfig: {
        output: {
          targets: ['node'],
        },
      },
    });

    const config = await rsbuild.unwrapWebpackConfig();
    expect(config).toEqual({});
  });
});
