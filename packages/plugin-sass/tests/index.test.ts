import { createRsbuild } from '@rsbuild/core';
import { matchRules } from '@scripts/test-helper';
import { pluginSass } from '../src';

type MatchedRuleWithOneOf = { oneOf?: Record<string, unknown>[] };

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

  it('should copy built-in CSS type, parser, and generator when css is enabled', async () => {
    const rsbuild = await createRsbuild({
      config: {
        css: true,
        plugins: [pluginSass()],
      },
    });

    const [rspackConfig] = await rsbuild.initConfigs();
    const sassRules = matchRules(
      rspackConfig,
      'a.scss',
    ) as MatchedRuleWithOneOf[];
    const oneOf = sassRules[0]?.oneOf;

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
        loader: expect.stringContaining('resolve-url-loader'),
      }),
      expect.objectContaining({
        loader: expect.stringContaining('sass-loader'),
      }),
    ]);
  });
});
