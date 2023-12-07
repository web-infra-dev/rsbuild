import { createStubRsbuild } from '@rsbuild/test-helper';
import { pluginNetworkPerformance } from '@src/plugins/networkPerformance';

describe('plugin-network-performance', () => {
  it('should add network performance plugin', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginNetworkPerformance()],
      rsbuildConfig: {
        performance: {
          preconnect: [
            {
              href: 'http://aaa.com',
            },
          ],
          dnsPrefetch: ['http://aaa.com'],
        },
      },
    });

    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should not add network performance plugin when target is server', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginNetworkPerformance()],
      rsbuildConfig: {
        performance: {
          preconnect: [
            {
              href: 'http://aaa.com',
            },
          ],
          dnsPrefetch: ['http://aaa.com'],
        },
        output: {
          targets: ['service-worker'],
        },
      },
    });

    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchInlineSnapshot('{}');
  });

  it('should not add network performance plugin by default', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginNetworkPerformance()],
      rsbuildConfig: {
        performance: {},
      },
    });

    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchInlineSnapshot('{}');
  });
});
