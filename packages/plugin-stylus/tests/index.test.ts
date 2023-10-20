import { expect, describe, it } from 'vitest';
import { createStubRsbuild } from '@rsbuild/test-helper';
import { webpackProvider } from '@rsbuild/webpack';
import { pluginStylus } from '../src';

describe('plugins/stylus', () => {
  it('should add stylus loader config correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginStylus()],
      provider: webpackProvider,
      rsbuildConfig: {},
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to configure stylus options', async () => {
    const rsbuild = await createStubRsbuild({
      provider: webpackProvider,
      rsbuildConfig: {},
      plugins: [
        pluginStylus({
          stylusOptions: {
            lineNumbers: false,
          },
        }),
      ],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
