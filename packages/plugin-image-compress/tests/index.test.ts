import { createRsbuild } from '@rsbuild/core';
import { pluginImageCompress } from '../src';

process.env.NODE_ENV = 'production';

describe('plugin-image-compress', () => {
  it('should generate correct options', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [pluginImageCompress()],
        output: {
          minify: false,
        },
      },
    });
    const configs = await rsbuild.initConfigs();
    expect(configs[0].optimization?.minimizer).toMatchSnapshot();
  });

  it('should accept `...options: Options[]` as parameter', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [pluginImageCompress('jpeg', { use: 'png' })],
        output: {
          minify: false,
        },
      },
    });
    const configs = await rsbuild.initConfigs();
    expect(configs[0].optimization?.minimizer).toMatchSnapshot();
  });

  it('should accept `options: Options[]` as parameter', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [pluginImageCompress(['jpeg', { use: 'png' }])],
        output: {
          minify: false,
        },
      },
    });
    const configs = await rsbuild.initConfigs();
    expect(configs[0].optimization?.minimizer).toMatchSnapshot();
  });
});
