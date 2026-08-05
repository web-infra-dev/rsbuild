import { createRsbuild } from '@rsbuild/core';
import { matchRules } from '@scripts/test-helper';
import { pluginSass } from '../src';

const getRuleLoaders = (rules: unknown): string[] => {
  const loaders: string[] = [];

  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
    } else if (value && typeof value === 'object') {
      if ('loader' in value && typeof value.loader === 'string') {
        loaders.push(value.loader.replaceAll('\\', '/'));
      }
      Object.values(value).forEach(visit);
    }
  };

  visit(rules);
  return loaders;
};

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
        output: {
          cssModules: {
            mode: 'global',
          },
        },
        plugins: [pluginSass()],
      },
    });

    const rspackConfigs = await rsbuild.initConfigs();
    const rules = matchRules(rspackConfigs[0], 'a.module.scss');
    const loaders = getRuleLoaders(rules);
    const oneOf = (rules[0] as { oneOf?: Record<string, any>[] }).oneOf;
    const mainRule = oneOf?.find(
      (rule) => rule.type === 'css/auto' && rule.parser?.exportType !== 'text',
    );
    const cssModulesRule = oneOf?.find(
      (rule) => rule.type === 'css/global' && String(rule.test).includes('module'),
    );
    const cssModulesLoaders = getRuleLoaders(cssModulesRule);
    const inlineRule = oneOf?.find((rule) => rule.parser?.exportType === 'text');

    expect(mainRule).toBeTruthy();
    expect(cssModulesRule).toBeTruthy();
    expect(cssModulesLoaders.some((loader) => loader.includes('sass-loader'))).toBe(true);
    expect(cssModulesLoaders).toContain('builtin:lightningcss-loader');
    expect(inlineRule).toMatchObject({
      type: 'css/auto',
      parser: {
        exportType: 'text',
        namedExports: true,
      },
    });
    expect(inlineRule).not.toHaveProperty('generator');
    expect(loaders.some((loader) => loader.includes('css-loader/index'))).toBe(false);
    expect(loaders.some((loader) => loader.includes('style-loader/index'))).toBe(false);
    expect(loaders.some((loader) => loader.includes('cssExtractLoader'))).toBe(false);
    expect(loaders).toContain('builtin:lightningcss-loader');
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
