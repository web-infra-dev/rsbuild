import { createRsbuild, pluginRspackBuiltinCss, type Rspack } from '@rsbuild/core';
import { matchPlugin, matchRules } from '@scripts/test-helper';
import { pluginVue } from '../src';

describe('plugin-vue', () => {
  it('should add vue-loader and VueLoaderPlugin correctly', async () => {
    const rsbuild = await createRsbuild({
      config: {
        plugins: [pluginVue()],
      },
    });
    const config = await rsbuild.initConfigs();

    expect(matchRules(config[0], 'a.vue')[0]).toMatchSnapshot();
    expect(matchPlugin(config[0], 'VueLoaderPlugin')).toMatchSnapshot();
    expect(config[0].resolve).toMatchSnapshot();
  });

  it('should allow to configure vueLoader options', async () => {
    const rsbuild = await createRsbuild({
      config: {
        plugins: [
          pluginVue({
            vueLoaderOptions: {
              hotReload: false,
            },
          }),
        ],
      },
    });
    const config = await rsbuild.initConfigs();
    expect(matchRules(config[0], 'a.vue')[0]).toMatchSnapshot();
  });

  it('should define feature flags correctly', async () => {
    const rsbuild = await createRsbuild({
      config: {
        plugins: [pluginVue()],
      },
    });
    const config = await rsbuild.initConfigs();
    expect(matchPlugin(config[0], 'DefinePlugin')).toMatchSnapshot();
  });

  it('should support Rspack built-in CSS rules', async () => {
    const rsbuild = await createRsbuild({
      config: {
        plugins: [pluginVue(), pluginRspackBuiltinCss()],
      },
    });
    const warn = rstest.spyOn(rsbuild.logger, 'warn').mockImplementation(() => {});

    const [config] = await rsbuild.initConfigs();
    const cssRule = matchRules(config, 'a.vue.css')[0] as {
      oneOf?: Rspack.RuleSetRule[];
    };

    expect(
      cssRule.oneOf?.some(
        (rule) =>
          rule.type === 'css/module' &&
          String(rule.resourceQuery) === String(/[?&]module(?:&|=|$)/),
      ),
    ).toBe(true);
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('output.cssModules.auto'));
  });

  it('should allow to custom test condition', async () => {
    const rsbuild = await createRsbuild({
      config: {
        plugins: [
          pluginVue({
            test: /\.(vue|md)$/,
          }),
        ],
      },
    });
    const config = await rsbuild.initConfigs();
    expect(matchRules(config[0], 'a.md')[0]).toMatchSnapshot();
  });
});
