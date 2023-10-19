import { expect, describe, it } from 'vitest';
import { createStubBuilder } from '@rsbuild/webpack/stub';
import { pluginStylus } from '../src';

describe('plugins/stylus', () => {
  it('should add stylus loader config correctly', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginStylus()],
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to configure stylus options', async () => {
    const builder = await createStubBuilder({
      plugins: [
        pluginStylus({
          stylusOptions: {
            lineNumbers: false,
          },
        }),
      ],
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
