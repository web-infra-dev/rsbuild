import { createRsbuild } from '@rsbuild/core';
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

  it('should skip disabled Vue and router chunk groups', async () => {
    const rsbuild = await createRsbuild({
      config: {
        plugins: [pluginVue({ splitChunks: { vue: false, router: false } })],
      },
    });
    const [config] = await rsbuild.initConfigs();
    const splitChunks = config.optimization?.splitChunks;

    expect(splitChunks).toEqual(expect.any(Object));
    expect(splitChunks).not.toHaveProperty('cacheGroups.vue');
    expect(splitChunks).not.toHaveProperty('cacheGroups.router');
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

  it('should keep experimentalInlineMatchResource enabled for node target when built-in CSS is enabled', async () => {
    const rsbuild = await createRsbuild({
      config: {
        css: true,
        output: {
          target: 'node',
        },
        plugins: [pluginVue()],
      },
    });
    const config = await rsbuild.initConfigs();
    const vueRule = matchRules(config[0], 'a.vue')[0] as {
      use?: { options?: Record<string, unknown> }[];
    };

    expect(vueRule.use?.[0]?.options?.experimentalInlineMatchResource).toBe(
      true,
    );
  });

  it('should disable experimentalInlineMatchResource for node target in legacy CSS mode', async () => {
    const rsbuild = await createRsbuild({
      config: {
        output: {
          target: 'node',
        },
        plugins: [pluginVue()],
      },
    });
    const config = await rsbuild.initConfigs();
    const vueRule = matchRules(config[0], 'a.vue')[0] as {
      use?: { options?: Record<string, unknown> }[];
    };

    expect(vueRule.use?.[0]?.options?.experimentalInlineMatchResource).toBe(
      false,
    );
  });
});
