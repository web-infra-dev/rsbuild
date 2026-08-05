import { createRsbuild } from '@rsbuild/core';
import { matchRules } from '@scripts/test-helper';
import { pluginTailwindcss } from '../src';

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

  it('should add tailwindcss loader to built-in CSS Modules rule', async () => {
    const rsbuild = await createRsbuild({
      config: {
        experiments: {
          css: true,
        },
        plugins: [pluginTailwindcss()],
      },
    });

    rstest.spyOn(rsbuild.logger, 'warn').mockImplementation(() => {});
    const rspackConfigs = await rsbuild.initConfigs();
    const rules = matchRules(rspackConfigs[0], 'a.module.css');
    const oneOf = (rules[0] as { oneOf?: Record<string, any>[] }).oneOf;
    const cssModulesRule = oneOf?.find((rule) => rule.type === 'css/module');
    const cssModulesLoaders = cssModulesRule?.use.map(({ loader }: { loader: string }) =>
      loader.replaceAll('\\', '/'),
    );
    const urlRule = oneOf?.find((rule) => String(rule.resourceQuery).includes('url'));

    expect(cssModulesLoaders).toEqual(
      expect.arrayContaining([expect.stringContaining('@tailwindcss/webpack')]),
    );
    expect(urlRule).toBeUndefined();
  });
});
