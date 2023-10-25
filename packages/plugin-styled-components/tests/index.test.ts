import { expect, describe, it, vi } from 'vitest';
import { pluginStyledComponents } from '../src';
import { createStubRsbuild } from '@rsbuild/test-helper';

describe('plugins/styled-components', () => {
  it('should works in rspack mode', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
    });

    rsbuild.addPlugins([pluginStyledComponents()]);
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
