import { createRsbuild } from '@rsbuild/core';
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
          pluginLess(),
          pluginLess({
            exclude: /b\.less/,
          }),
        ],
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    const lessRule = matchRules(bundlerConfigs[0], 'a.less');
    expect(lessRule.length).toBe(2);
    expect(lessRule).toMatchSnapshot();
  });
});
