import { createRsbuild } from '@rsbuild/core';
import { matchRules } from '@scripts/test-helper';
import { pluginLess } from '../src';

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

describe('plugin-less', () => {
  it('should add less-loader', async () => {
    const rsbuild = await createRsbuild({
      config: {
        plugins: [pluginLess()],
      },
    });

    const rspackConfigs = await rsbuild.initConfigs();
    expect(matchRules(rspackConfigs[0], 'a.less')).toMatchSnapshot();
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
        plugins: [pluginLess()],
      },
    });

    const rspackConfigs = await rsbuild.initConfigs();
    const rules = matchRules(rspackConfigs[0], 'a.module.less');
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
    expect(cssModulesLoaders.some((loader) => loader.includes('less-loader'))).toBe(true);
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

  it('should add less-loader and css-loader when injectStyles', async () => {
    const rsbuild = await createRsbuild({
      config: {
        plugins: [pluginLess()],
        output: {
          injectStyles: true,
        },
      },
    });

    const rspackConfigs = await rsbuild.initConfigs();
    expect(matchRules(rspackConfigs[0], 'a.less')).toMatchSnapshot();
  });

  it('should add less-loader with tools.less', async () => {
    const rsbuild = await createRsbuild({
      config: {
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

    const rspackConfigs = await rsbuild.initConfigs();
    expect(matchRules(rspackConfigs[0], 'a.less')).toMatchSnapshot();
  });

  it('should add less-loader with excludes', async () => {
    const rsbuild = await createRsbuild({
      config: {
        plugins: [
          pluginLess({
            lessLoaderOptions(_config, { addExcludes }) {
              addExcludes(/node_modules/);
            },
          }),
        ],
      },
    });

    const rspackConfigs = await rsbuild.initConfigs();
    expect(matchRules(rspackConfigs[0], 'a.less')).toMatchSnapshot();
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
      config: {
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

    const rspackConfigs = await rsbuild.initConfigs();

    expect(matchRules(rspackConfigs[0], 'a.less')).toMatchSnapshot();
  });

  it('should allow to add multiple less rules', async () => {
    const rsbuild = await createRsbuild({
      config: {
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

    const rspackConfigs = await rsbuild.initConfigs();
    expect(matchRules(rspackConfigs[0], 'a.less').length).toBe(1);
    expect(matchRules(rspackConfigs[0], 'b.less').length).toBe(2);
  });
});
