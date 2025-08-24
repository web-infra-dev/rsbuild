import { createRsbuild, type RsbuildPluginAPI } from '@rsbuild/core';
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

  it('should be compatible with Rsbuild < 1.3.0', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [
          {
            name: 'rsbuild-plugin-test',
            post: ['rsbuild:css'],
            setup(api: RsbuildPluginAPI) {
              api.modifyBundlerChain((chain, { CHAIN_ID }) => {
                chain.module.rules.delete(CHAIN_ID.RULE.CSS_INLINE);
                // @ts-expect-error
                delete CHAIN_ID.RULE.CSS_INLINE;
              });
            },
          },
          pluginStylus(),
        ],
      },
    });

    await rsbuild.initConfigs();

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(matchRules(bundlerConfigs[0], 'a.styl').length).toBe(2);
    expect(matchRules(bundlerConfigs[0], 'a.styl?inline').length).toBe(0);
  });
});
