import type { RsbuildPlugin } from '@rsbuild/core';
import { pluginFallback } from '../src/shared/plugins/fallback';
import { createStubRsbuild } from '../../webpack/tests/helper';

describe('plugin-fallback', () => {
  const testPlugin: RsbuildPlugin = {
    name: 'test-plugin',
    setup(api) {
      api.modifyWebpackChain((chain) => {
        chain.module
          .rule('mjs')
          .test(/\.m?js/)
          .resolve.set('fullySpecified', false);

        chain.module
          .rule('foo')
          .oneOf('foo')
          .test(/foo/)
          .use('foo')
          .loader('foo');

        chain.module
          .rule('data-uri')
          .resolve.set('fullySpecified', false)
          .end()
          .mimetype('text/javascript')
          .use('data-uri')
          .loader('data-uri');

        chain.module.rule('bar').test(/bar/).use('bar').loader('bar');
      });
    },
  };

  it('should convert fallback rule correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [testPlugin, pluginFallback()],
      rsbuildConfig: {
        output: {
          enableAssetFallback: true,
        },
      },
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should not convert fallback rule when output.enableAssetFallback is not enabled', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [testPlugin, pluginFallback()],
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
