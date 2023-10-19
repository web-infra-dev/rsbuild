import { expect, describe, it } from 'vitest';
import { pluginFallback } from '@/plugins/fallback';
import { RsbuildPlugin } from '@/types';
import { createStubRsbuild } from '../helper';

describe('plugins/fallback', () => {
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
      builderConfig: {
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
