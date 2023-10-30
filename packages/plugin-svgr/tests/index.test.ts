import { expect, describe, it } from 'vitest';
import { pluginSvgr } from '../src';
import { createStubRsbuild } from '@rsbuild/test-helper';
import { SVG_REGEX } from '@rsbuild/shared';

describe('svgr', () => {
  const cases = [
    {
      name: 'export default url',
      pluginConfig: {},
    },
    {
      name: 'export default Component',
      pluginConfig: {
        svgDefaultExport: 'component' as const,
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
