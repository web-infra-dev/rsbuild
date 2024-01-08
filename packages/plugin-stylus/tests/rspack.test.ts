import { createStubRsbuild } from '@rsbuild/test-helper';
import { pluginStylus } from '../src';

describe('plugin-stylus', () => {
  it('should add stylus loader config correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginStylus()],
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should allow to configure stylus options', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [
        pluginStylus({
          stylusOptions: {
            lineNumbers: false,
          },
        }),
      ],
    });
    const bundlerConfigs = await rsbuild.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });
});
