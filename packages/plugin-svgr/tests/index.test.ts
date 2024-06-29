import { pluginReact } from '@rsbuild/plugin-react';
import { createStubRsbuild, matchRules } from '@scripts/test-helper';
import { describe, expect, it } from 'vitest';
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
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
    });

    rsbuild.addPlugins([pluginSvgr(item.pluginConfig), pluginReact()]);

    const config = await rsbuild.unwrapConfig();
    expect(matchRules(config, 'a.svg')[0]).toMatchSnapshot();
  });
});
