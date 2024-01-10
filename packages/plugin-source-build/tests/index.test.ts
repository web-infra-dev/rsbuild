import { createStubRsbuild } from '@scripts/test-helper';
import { pluginBabel } from '@rsbuild/plugin-babel';
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
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
