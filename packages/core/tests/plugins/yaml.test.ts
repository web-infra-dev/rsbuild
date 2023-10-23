import { expect, describe, it } from 'vitest';
import { createStubRsbuild } from '@rsbuild/test-helper';
import { pluginYaml } from '@src/plugins/yaml';

describe('plugins/yaml', () => {
  it('should add yaml rule properly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginYaml()],
      rsbuildConfig: {},
    });

    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
