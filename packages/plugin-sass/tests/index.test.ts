import { createRsbuild } from '@rsbuild/core';
import { matchRules } from '@scripts/test-helper';
import { pluginSass } from '../src';

describe('plugin-sass', () => {
  it('should add sass-loader', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [pluginSass()],
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(matchRules(bundlerConfigs[0], 'a.scss')).toMatchSnapshot();
  });

  it('should add sass-loader and css-loader when injectStyles', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [pluginSass()],
        output: {
          injectStyles: true,
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(matchRules(bundlerConfigs[0], 'a.scss')).toMatchSnapshot();
  });

  it('should add sass-loader with excludes', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [
          pluginSass({
            sassLoaderOptions(_config, { addExcludes }) {
              addExcludes(/node_modules/);
            },
          }),
        ],
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(matchRules(bundlerConfigs[0], 'a.scss')).toMatchSnapshot();
  });

  it('should allow to use legacy API and mute deprecation warnings', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [
          pluginSass({
            sassLoaderOptions: {
              api: 'legacy',
            },
          }),
        ],
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(matchRules(bundlerConfigs[0], 'a.scss')).toMatchSnapshot();
  });

  it('should allow to add multiple sass rules', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [
          pluginSass({
            include: [/a\.scss/, /b\.scss/],
          }),
          pluginSass({
            include: /b\.scss/,
          }),
        ],
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(matchRules(bundlerConfigs[0], 'a.scss').length).toBe(1);
    expect(matchRules(bundlerConfigs[0], 'b.scss').length).toBe(2);
  });
});
