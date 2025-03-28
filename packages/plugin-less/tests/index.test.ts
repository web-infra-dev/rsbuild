import { RsbuildPluginAPI, createRsbuild } from '@rsbuild/core';
import { matchRules } from '@scripts/test-helper';
import { pluginLess } from '../src';

describe('plugin-less', () => {
  it('should add less-loader', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [pluginLess()],
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(matchRules(bundlerConfigs[0], 'a.less')).toMatchSnapshot();
  });

  it('should add less-loader and css-loader when injectStyles', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [pluginLess()],
        output: {
          injectStyles: true,
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(matchRules(bundlerConfigs[0], 'a.less')).toMatchSnapshot();
  });

  it('should add less-loader with tools.less', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [
          pluginLess({
            lessLoaderOptions: {
              lessOptions: {
                javascriptEnabled: false,
              },
            },
          }),
        ],
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(matchRules(bundlerConfigs[0], 'a.less')).toMatchSnapshot();
  });

  it('should add less-loader with excludes', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [
          pluginLess({
            lessLoaderOptions(_config, { addExcludes }) {
              addExcludes(/node_modules/);
            },
          }),
        ],
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(matchRules(bundlerConfigs[0], 'a.less')).toMatchSnapshot();
  });

  it('should allow to use Less plugins', async () => {
    class MockPlugin {
      options?: unknown;
      constructor(options?: unknown) {
        this.options = options;
      }
      install() {}
    }

    const mockPlugin = new MockPlugin({ foo: 'bar' });
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [
          pluginLess({
            lessLoaderOptions: {
              lessOptions: {
                plugins: [mockPlugin],
              },
            },
          }),
        ],
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(matchRules(bundlerConfigs[0], 'a.less')).toMatchSnapshot();
  });

  it('should allow to add multiple less rules', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [
          pluginLess({
            include: [/a\.less/, /b\.less/],
          }),
          pluginLess({
            include: /b\.less/,
          }),
        ],
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(matchRules(bundlerConfigs[0], 'a.less').length).toBe(2);
    expect(matchRules(bundlerConfigs[0], 'b.less').length).toBe(5);
  });

  it('should be compatible with Rsbuild < 1.3.0', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [
          {
            name: 'rsbuild-plugin-test',
            post: ['rsbuild:css'],
            setup(api: RsbuildPluginAPI) {
              // Mock the behavior of Rsbuild < 1.3.0
              api.modifyBundlerChain((chain, { CHAIN_ID }) => {
                chain.module.rules.delete(CHAIN_ID.RULE.CSS_INLINE);
              });
            },
          },
          pluginLess(),
        ],
      },
    });

    await rsbuild.initConfigs();

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(matchRules(bundlerConfigs[0], 'a.less').length).toBe(2);
    expect(matchRules(bundlerConfigs[0], 'a.less?inline').length).toBe(0);
  });
});
