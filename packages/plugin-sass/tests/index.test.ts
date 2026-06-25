import { createRsbuild } from '@rsbuild/core';
import { matchRules } from '@scripts/test-helper';
import { pluginSass } from '../src';

describe('plugin-sass', () => {
  it('should add sass-loader', async () => {
    const rsbuild = await createRsbuild({
      config: {
        plugins: [pluginSass()],
      },
    });

    const rspackConfigs = await rsbuild.initConfigs();
    expect(matchRules(rspackConfigs[0], 'a.scss')).toMatchSnapshot();
  });

  it('should use Rspack built-in CSS when experiments.css is true', async () => {
    const rsbuild = await createRsbuild({
      config: {
        experiments: {
          css: true,
        },
        plugins: [pluginSass()],
      },
    });

    const rspackConfigs = await rsbuild.initConfigs();
    const rules = matchRules(rspackConfigs[0], 'a.scss');
    const mainRule = (rules[0] as { oneOf?: Record<string, unknown>[] }).oneOf?.find(
      (rule) => rule.type === 'css/auto',
    );

    expect(rules).toMatchSnapshot();
    expect(mainRule).toBeTruthy();
    expect(JSON.stringify(rules)).not.toContain('css-loader');
    expect(JSON.stringify(rules)).not.toContain('style-loader');
    expect(JSON.stringify(rules)).not.toContain('cssExtractLoader');
  });

  it('should add sass-loader and css-loader when injectStyles', async () => {
    const rsbuild = await createRsbuild({
      config: {
        plugins: [pluginSass()],
        output: {
          injectStyles: true,
        },
      },
    });

    const rspackConfigs = await rsbuild.initConfigs();
    expect(matchRules(rspackConfigs[0], 'a.scss')).toMatchSnapshot();
  });

  it('should add sass-loader with excludes', async () => {
    const rsbuild = await createRsbuild({
      config: {
        plugins: [
          pluginSass({
            sassLoaderOptions(_config, { addExcludes }) {
              addExcludes(/node_modules/);
            },
          }),
        ],
      },
    });

    const rspackConfigs = await rsbuild.initConfigs();
    expect(matchRules(rspackConfigs[0], 'a.scss')).toMatchSnapshot();
  });

  it('should allow to use legacy API and mute deprecation warnings', async () => {
    const rsbuild = await createRsbuild({
      config: {
        plugins: [
          pluginSass({
            sassLoaderOptions: {
              api: 'legacy',
            },
          }),
        ],
      },
    });

    const rspackConfigs = await rsbuild.initConfigs();
    expect(matchRules(rspackConfigs[0], 'a.scss')).toMatchSnapshot();
  });

  it('should allow to add multiple sass rules', async () => {
    const rsbuild = await createRsbuild({
      config: {
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

    const rspackConfigs = await rsbuild.initConfigs();
    expect(matchRules(rspackConfigs[0], 'a.scss').length).toBe(1);
    expect(matchRules(rspackConfigs[0], 'b.scss').length).toBe(2);
  });
});
