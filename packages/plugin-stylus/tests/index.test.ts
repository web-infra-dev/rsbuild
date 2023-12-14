import { createStubRsbuild } from '@rsbuild/test-helper';
import { pluginStylus } from '../src';

describe('plugin-stylus', () => {
  it('should add stylus loader config correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginStylus()],
      rsbuildConfig: {},
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to configure stylus options', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
      plugins: [
        pluginStylus({
          stylusOptions: {
            lineNumbers: false,
          },
        }),
      ],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
