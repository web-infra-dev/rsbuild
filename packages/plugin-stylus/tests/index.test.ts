import { createRsbuild, type Rspack } from '@rsbuild/core';
import { createRsbuild as createRsbuildV1 } from '@rsbuild/core-v1';
import { matchRules } from '@scripts/test-helper';
import { pluginStylus } from '../src';

describe('plugin-stylus', () => {
  it('should add stylus loader config correctly', async () => {
    const rsbuild = await createRsbuild({
      config: {
        plugins: [pluginStylus()],
      },
    });

    const rspackConfigs = await rsbuild.initConfigs();
    expect(matchRules(rspackConfigs[0], 'a.styl')).toMatchSnapshot();
  });

  it('should add stylus loader for Rsbuild v1', async () => {
    const rsbuild = await createRsbuildV1({
      config: {
        plugins: [pluginStylus()],
      },
    });

    const rspackConfigs = await rsbuild.initConfigs();
    expect(
      matchRules(rspackConfigs[0] as Rspack.Configuration, 'a.styl'),
    ).toMatchSnapshot();
  });

  it('should allow to configure stylus options', async () => {
    const rsbuild = await createRsbuild({
      config: {
        plugins: [
          pluginStylus({
            stylusOptions: {
              lineNumbers: false,
            },
          }),
        ],
      },
    });
    const rspackConfigs = await rsbuild.initConfigs();
    expect(matchRules(rspackConfigs[0], 'a.styl')).toMatchSnapshot();
  });
});
