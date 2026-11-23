import path from 'node:path';
import { createRsbuild } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { matchRules } from '@scripts/test-helper';
import { type PluginSvgrOptions, pluginSvgr } from '../src';

describe('svgr', () => {
  const cases: Array<{ name: string; pluginConfig: PluginSvgrOptions }> = [
    {
      name: 'exportType named / mixedImport true',
      pluginConfig: {
        svgrOptions: {
          exportType: 'named',
        },
        mixedImport: true,
      },
    },
    {
      name: 'exportType named / mixedImport false',
      pluginConfig: {
        svgrOptions: {
          exportType: 'named',
        },
        mixedImport: false,
      },
    },
    {
      name: 'exportType default / mixedImport false',
      pluginConfig: {
        svgrOptions: {
          exportType: 'default',
        },
        mixedImport: false,
      },
    },
    {
      name: 'exportType default / mixedImport true',
      pluginConfig: {
        svgrOptions: {
          exportType: 'default',
        },
        mixedImport: true,
      },
    },
    {
      name: 'configure SVGR options',
      pluginConfig: {
        svgrOptions: {
          svgoConfig: {
            datauri: 'base64',
          },
        },
      },
    },
  ];

  it.each(cases)('$name', async (item) => {
    const rsbuild = await createRsbuild({
      cwd: import.meta.dirname,
      config: {
        mode: 'development',
        plugins: [pluginSvgr(item.pluginConfig), pluginReact()],
      },
    });

    const config = await rsbuild.initConfigs();
    expect(matchRules(config[0], 'a.svg')[0]).toMatchSnapshot();
  });

  it('should merge repeated SVGO plugins in order', async () => {
    let svgrOptions: PluginSvgrOptions['svgrOptions'];
    const rsbuild = await createRsbuild({
      cwd: import.meta.dirname,
      config: {
        plugins: [
          pluginSvgr({
            svgrOptions: {
              svgoConfig: {
                plugins: [
                  'prefixIds',
                  { name: 'prefixIds', params: { prefix: 'icon' } },
                  { name: 'prefixIds', params: { delim: '__' } },
                  'prefixIds',
                ],
              },
            },
          }),
        ],
        tools: {
          bundlerChain(chain, { CHAIN_ID }) {
            svgrOptions = chain.module
              .rule(CHAIN_ID.RULE.SVG)
              .oneOf(CHAIN_ID.ONE_OF.SVG_REACT)
              .use(CHAIN_ID.USE.SVGR)
              .get('options') as PluginSvgrOptions['svgrOptions'];
          },
        },
      },
    });
    await rsbuild.initConfigs();

    expect(svgrOptions?.svgoConfig?.plugins).toEqual([
      {
        name: 'preset-default',
        params: { overrides: { removeViewBox: false } },
      },
      { name: 'prefixIds', params: { prefix: 'icon', delim: '__' } },
    ]);
  });

  it('should configure Rspack loader cache when `cache` is true', async () => {
    const rsbuild = await createRsbuild({
      cwd: import.meta.dirname,
      config: {
        mode: 'development',
        plugins: [
          pluginSvgr({
            cache: true,
            mixedImport: true,
          }),
          pluginReact(),
        ],
      },
    });

    const config = await rsbuild.initConfigs();
    const [svgRule] = matchRules(config[0], 'a.svg') as Array<{
      oneOf: Array<{
        use?: Array<{ loader?: string; cache?: boolean }>;
      }>;
    }>;

    const usesWithUse = svgRule.oneOf.filter((item) => item.use?.length);
    expect(usesWithUse).toHaveLength(2);

    for (const branch of usesWithUse) {
      const uses = branch.use ?? [];
      const svgrUses = uses.filter(
        (use) => path.basename(use.loader ?? '') === 'loader.mjs',
      );
      const otherUses = uses.filter(
        (use) => path.basename(use.loader ?? '') !== 'loader.mjs',
      );

      expect(svgrUses).toHaveLength(1);
      expect(svgrUses[0].cache).toBe(true);
      expect(otherUses.every((use) => use.cache === undefined)).toBe(true);
    }
  });
});
