import { createStubRsbuild } from '@rsbuild/test-helper';
import { pluginNodePolyfill } from '../src';

describe('plugin-node-polyfill', () => {
  it('should add node-polyfill config', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginNodePolyfill()],
    });
    const configs = await rsbuild.initConfigs();

    expect(configs[0]).toMatchSnapshot();
  });

  it('should add node-polyfill config when use webpack', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginNodePolyfill()],
      rsbuildConfig: {},
    });
    const configs = await rsbuild.initConfigs();

    expect(configs[0]).toMatchSnapshot();
  });
});
