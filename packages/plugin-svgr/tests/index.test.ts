import { expect, describe, it } from 'vitest';
import { type PluginSvgrOptions, pluginSvgr } from '../src';
import { createStubRsbuild } from '@scripts/test-helper';
import { pluginReact } from '@rsbuild/plugin-react';
import { SVG_REGEX } from '@rsbuild/shared';

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

    expect(
      config.module.rules.find((r) => r.test === SVG_REGEX),
    ).toMatchSnapshot();
  });
});
