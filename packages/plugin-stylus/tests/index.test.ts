import { createRsbuild } from '@rsbuild/core';
import { matchRules } from '@scripts/test-helper';
import { pluginStylus } from '../src';

describe('plugin-stylus', () => {
  it('should add stylus loader config correctly', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [pluginStylus()],
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(matchRules(bundlerConfigs[0], 'a.styl')).toMatchSnapshot();
  });

  it('should allow to configure stylus options', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [
          pluginStylus({
            stylusOptions: {
              lineNumbers: false,
            },
          }),
        ],
      },
    });
    const bundlerConfigs = await rsbuild.initConfigs();
    expect(matchRules(bundlerConfigs[0], 'a.styl')).toMatchSnapshot();
  });
});
