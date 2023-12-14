import { createStubRsbuild } from '@rsbuild/test-helper';
import { pluginAsset } from '@rsbuild/core/plugins/asset';
import { pluginImageCompress } from '../src';

process.env.NODE_ENV = 'production';

describe('plugin-image-compress', () => {
  it('should generate correct options', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
      plugins: [pluginAsset(), pluginImageCompress()],
    });
    expect(await rsbuild.unwrapConfig()).toMatchSnapshot();
  });

  it('should accept `...options: Options[]` as parameter', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
      plugins: [pluginAsset(), pluginImageCompress('jpeg', { use: 'png' })],
    });
    const config = await rsbuild.unwrapConfig();
    expect(config.optimization?.minimizer).toMatchInlineSnapshot(`
      [
        ModernJsImageMinimizerPlugin {
          "name": "@rsbuild/plugin-image-compress/minimizer",
          "options": {
            "test": /\\\\\\.\\(jpg\\|jpeg\\)\\$/,
            "use": "jpeg",
          },
        },
        ModernJsImageMinimizerPlugin {
          "name": "@rsbuild/plugin-image-compress/minimizer",
          "options": {
            "test": /\\\\\\.png\\$/,
            "use": "png",
          },
        },
      ]
    `);
  });

  it('should accept `options: Options[]` as parameter', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
      plugins: [pluginAsset(), pluginImageCompress(['jpeg', { use: 'png' }])],
    });
    const config = await rsbuild.unwrapConfig();
    expect(config.optimization?.minimizer).toMatchInlineSnapshot(`
      [
        ModernJsImageMinimizerPlugin {
          "name": "@rsbuild/plugin-image-compress/minimizer",
          "options": {
            "test": /\\\\\\.\\(jpg\\|jpeg\\)\\$/,
            "use": "jpeg",
          },
        },
        ModernJsImageMinimizerPlugin {
          "name": "@rsbuild/plugin-image-compress/minimizer",
          "options": {
            "test": /\\\\\\.png\\$/,
            "use": "png",
          },
        },
      ]
    `);
  });
});
