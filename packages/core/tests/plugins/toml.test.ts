import { expect, describe, it } from 'vitest';
import { createStubRsbuild } from '@rsbuild/test-helper';
import { pluginToml } from '@src/plugins/toml';

describe('plugins/toml', () => {
  it('should add toml rule properly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginToml()],
      rsbuildConfig: {},
    });

    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
