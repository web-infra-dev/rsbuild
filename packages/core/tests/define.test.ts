import { createStubRsbuild } from '@scripts/test-helper';
import { pluginDefine } from '../src/plugins/define';

describe('plugin-define', () => {
  test('should register define plugin correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginDefine()],
      rsbuildConfig: {
        source: {
          define: {
            NAME: JSON.stringify('Jack'),
          },
        },
      },
    });

    const config = await rsbuild.unwrapConfig();
    expect(config).toMatchSnapshot();
  });
});
