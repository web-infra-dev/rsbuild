import { createRsbuild } from '@rsbuild/core';
import { matchRules } from '@scripts/test-helper';
import { pluginTailwindcss } from '../src';

type MatchedRuleWithOneOf = { oneOf?: Record<string, unknown>[] };

describe('plugin-tailwindcss', () => {
  it('should add tailwindcss loader to CSS rule', async () => {
    const rsbuild = await createRsbuild({
      config: {
        plugins: [pluginTailwindcss()],
      },
    });

    const rspackConfigs = await rsbuild.initConfigs();
    expect(matchRules(rspackConfigs[0], 'a.css')).toMatchSnapshot();
  });

  it('should respect css.exportsOnly while keeping css-url and css-inline when css is enabled', async () => {
    const rsbuild = await createRsbuild({
      config: {
        css: {
          exportsOnly: true,
        },
        output: {
          emitCss: true,
        },
        plugins: [pluginTailwindcss()],
      },
    });

    const [rspackConfig] = await rsbuild.initConfigs();
    const cssRules = matchRules(
      rspackConfig,
      'a.css',
    ) as MatchedRuleWithOneOf[];
    const oneOf = cssRules[0]?.oneOf;

    expect(oneOf).toBeDefined();
    const urlRule = oneOf?.find(
      (rule) => String(rule.resourceQuery) === String(/[?&]url(?:&|=|$)/),
    );
    expect(urlRule).toBeDefined();
    expect(JSON.stringify(urlRule?.use)).toContain('cssUrlLoader');
    expect(JSON.stringify(urlRule?.use)).toContain('@tailwindcss/webpack');

    const mainRule = oneOf?.find((rule) => rule.type === 'css/auto');
    expect(JSON.stringify(mainRule?.use)).toContain('ignoreCssLoader');
    expect(JSON.stringify(mainRule?.use)).not.toContain('@tailwindcss/webpack');

    const inlineRule = oneOf?.find(
      (rule) => String(rule.resourceQuery) === String(/[?&]inline(?:&|=|$)/),
    );
    expect(JSON.stringify(inlineRule?.use)).toContain('@tailwindcss/webpack');
  });
});
