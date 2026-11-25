import { createRsbuild } from '@rsbuild/core';
import { matchRules } from '@scripts/test-helper';
import { pluginLess } from '../src';

type MatchedRuleWithOneOf = { oneOf?: Record<string, unknown>[] };

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

  it('should copy built-in CSS type, parser, and generator when css is enabled', async () => {
    const rsbuild = await createRsbuild({
      config: {
        css: true,
        plugins: [pluginLess()],
      },
    });

    const [rspackConfig] = await rsbuild.initConfigs();
    const lessRules = matchRules(
      rspackConfig,
      'a.less',
    ) as MatchedRuleWithOneOf[];
    const oneOf = lessRules[0]?.oneOf;

    expect(oneOf).toBeDefined();
    expect(JSON.stringify(oneOf)).not.toContain('compiled/css-loader');
    expect(JSON.stringify(oneOf)).not.toContain('cssExtractLoader');
    expect(
      oneOf?.find(
        (rule) => rule.type === 'css/auto' && !rule.resourceQuery && !rule.with,
      ),
    ).toMatchObject({
      type: 'css/auto',
      sideEffects: true,
    });
    expect(
      oneOf?.find(
        (rule) => String(rule.resourceQuery) === String(/[?&]inline(?:&|=|$)/),
      ),
    ).toMatchObject({
      type: 'css',
      parser: {
        exportType: 'text',
        namedExports: true,
      },
      generator: {
        exportsOnly: false,
      },
    });
    const urlRule = oneOf?.find(
      (rule) => String(rule.resourceQuery) === String(/[?&]url(?:&|=|$)/),
    );
    expect(urlRule?.use).toEqual([
      expect.objectContaining({
        loader: expect.stringContaining('cssUrlLoader'),
        options: expect.objectContaining({
          builtinCss: true,
        }),
      }),
      expect.objectContaining({
        loader: 'builtin:lightningcss-loader',
      }),
      expect.objectContaining({
        loader: expect.stringContaining('less-loader'),
      }),
    ]);
  });

  it('should place ignoreCssLoader before less-loader and copy parser when css.exportsOnly is enabled', async () => {
    const rsbuild = await createRsbuild({
      config: {
        css: true,
        output: {
          target: 'node',
        },
        plugins: [pluginLess()],
      },
    });

    const [rspackConfig] = await rsbuild.initConfigs();
    const lessRules = matchRules(
      rspackConfig,
      'a.less',
    ) as MatchedRuleWithOneOf[];
    const mainRule = lessRules[0]?.oneOf?.find(
      (rule) => rule.type === 'css/auto' && !rule.resourceQuery && !rule.with,
    );

    expect(mainRule).toMatchObject({
      type: 'css/auto',
      parser: { url: false },
    });
    expect(mainRule?.use).toEqual([
      expect.objectContaining({
        loader: expect.stringContaining('ignoreCssLoader'),
        options: {
          modules: { auto: true },
        },
      }),
      expect.objectContaining({
        loader: expect.stringContaining('less-loader'),
      }),
    ]);
  });
});
