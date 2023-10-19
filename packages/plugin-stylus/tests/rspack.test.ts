import { expect, describe, it } from 'vitest';
import { createStubRsbuild } from '@rsbuild/vitest-helper';
import { pluginStylus } from '../src';

describe('plugins/stylus', () => {
  it('should add stylus loader config correctly', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginStylus() as any],
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should allow to configure stylus options', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [
        pluginStylus({
          stylusOptions: {
            lineNumbers: false,
          },
        }) as any,
      ],
    });
    const bundlerConfigs = await rsbuild.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });
});
