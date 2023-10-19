import { expect, describe, it } from 'vitest';
import { createBuilder } from '@rspack-builder/tests/helper';
import { pluginStylus } from '../src';

describe('plugins/stylus', () => {
  it('should add stylus loader config correctly', async () => {
    const builder = await createBuilder({
      plugins: [pluginStylus() as any],
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should allow to configure stylus options', async () => {
    const builder = await createBuilder({
      plugins: [
        pluginStylus({
          stylusOptions: {
            lineNumbers: false,
          },
        }) as any,
      ],
    });
    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });
});
