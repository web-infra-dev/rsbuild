import { expect, describe, it, test } from 'vitest';
import { PluginSvgrOptions, pluginSvgr } from '../src';
import { createStubRsbuild } from '@rsbuild/test-helper';
import { SVG_REGEX } from '@rsbuild/shared';

describe('svgr', () => {
  const cases: Array<{ name: string; pluginConfig: PluginSvgrOptions }> = [
    {
      name: 'export default url',
      pluginConfig: {},
    },
    {
      name: 'export default Component',
      pluginConfig: {
        svgDefaultExport: 'component',
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

    rsbuild.addPlugins([pluginSvgr(item.pluginConfig)]);

    const config = await rsbuild.unwrapConfig();

    expect(
      config.module.rules.find((r) => r.test === SVG_REGEX),
    ).toMatchSnapshot();
  });
});
