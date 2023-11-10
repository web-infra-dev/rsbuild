import { pluginSRI } from '../src/webpack/plugins/sri';
import { createStubRsbuild } from '../../webpack/tests/helper';

describe('plugin-sri', () => {
  it('should apply default sri plugin', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginSRI(true)],
    });

    const config = await rsbuild.unwrapWebpackConfig();
    expect(config.output?.crossOriginLoading).toBe('anonymous');
  });

  it('should apply sri plugin', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [
        pluginSRI({
          hashFuncNames: ['sha384'],
          enabled: true,
        }),
      ],
    });

    const config = await rsbuild.unwrapWebpackConfig();
    expect(config.output?.crossOriginLoading).toBe('anonymous');
  });
});
