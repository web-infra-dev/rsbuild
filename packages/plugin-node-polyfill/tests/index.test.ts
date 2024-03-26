import { createStubRsbuild } from '@scripts/test-helper';
import { pluginNodePolyfill } from '../src';

describe('plugin-node-polyfill', () => {
  it('should add node-polyfill config', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginNodePolyfill()],
    });
    const configs = await rsbuild.initConfigs();

    expect(configs[0]).toMatchSnapshot();
  });

  it('should allow to remove protocol imports', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [
        pluginNodePolyfill({
          protocolImports: false,
        }),
      ],
    });
    const configs = await rsbuild.initConfigs();

    expect(configs[0]).toMatchSnapshot();
  });

  it('should allow to disable globals', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [
        pluginNodePolyfill({
          globals: {
            Buffer: false,
            process: false,
          },
        }),
      ],
    });
    const configs = await rsbuild.initConfigs();

    expect(configs[0]).toMatchSnapshot();
  });
});
