import { expect, describe, it } from 'vitest';
import { createStubBuilder } from '@rsbuild/vitest-helper';
import { pluginStylus } from '../src';

describe('plugins/stylus', () => {
  it('should add stylus loader config correctly', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginStylus() as any],
    });

    const bundlerConfigs = await builder.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should allow to configure stylus options', async () => {
    const builder = await createStubBuilder({
      plugins: [
        pluginStylus({
          stylusOptions: {
            lineNumbers: false,
          },
        }) as any,
      ],
    });
    const bundlerConfigs = await builder.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });
});
