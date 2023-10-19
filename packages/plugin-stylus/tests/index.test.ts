import { expect, describe, it } from 'vitest';
import { createStubRsbuild } from '@rsbuild/webpack/stub';
import { pluginStylus } from '../src';

describe('plugins/stylus', () => {
  it('should add stylus loader config correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginStylus()],
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to configure stylus options', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [
        pluginStylus({
          stylusOptions: {
            lineNumbers: false,
          },
        }),
      ],
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
