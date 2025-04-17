import { createRsbuild } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { matchRules } from '@scripts/test-helper';
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
    const rsbuild = await createRsbuild({
      cwd: import.meta.dirname,
      rsbuildConfig: {
        plugins: [pluginSvgr(item.pluginConfig), pluginReact()],
      },
    });

    const config = await rsbuild.initConfigs();
    expect(matchRules(config[0], 'a.svg')[0]).toMatchSnapshot();
  });
});
