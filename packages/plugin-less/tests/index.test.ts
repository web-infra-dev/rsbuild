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
});
