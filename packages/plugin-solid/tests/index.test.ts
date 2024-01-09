import { createStubRsbuild } from '@rsbuild/test-helper';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginSolid } from '../src';

describe('plugin-solid', () => {
  it('should apply solid preset correctly in rspack mode', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
      plugins: [pluginSolid(), pluginBabel()],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should apply solid preset correctly', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
      plugins: [pluginSolid(), pluginBabel()],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to configure solid preset options', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
      plugins: [
        pluginSolid({
          solidPresetOptions: {
            generate: 'ssr',
            hydratable: true,
          },
        }),
        pluginBabel(),
      ],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
