import { pluginBabel } from '@rsbuild/plugin-babel';
import { createStubRsbuild } from '@scripts/test-helper';
import { pluginSourceBuild } from '../src';

describe('plugin-source-build', () => {
  it('should allow to set resolve priority', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [
        pluginBabel(),
        pluginSourceBuild({
          resolvePriority: 'output',
        }),
      ],
      rsbuildConfig: {
        performance: {
          buildCache: false,
        },
      },
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
