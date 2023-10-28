import { pluginPug } from '@/plugins/pug';
import { createStubRsbuild } from '../helper';

describe('plugin-pug', () => {
  it('should add pug rules correctly when tools.pug is used', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginPug()],
      rsbuildConfig: {
        tools: {
          pug: {
            pretty: true,
          },
        },
      },
    });

    const config = await rsbuild.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should not add pug rules correctly when tools.pug is not used', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginPug()],
    });

    const config = await rsbuild.unwrapWebpackConfig();
    expect(config).toEqual({});
  });
});
