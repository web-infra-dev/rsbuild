import { expect, describe, it, vi } from 'vitest';
import { pluginReact } from '../src';
import { createStubRsbuild } from '@rsbuild/test-helper';
import { SVG_REGEX, mergeRegex, JS_REGEX, TS_REGEX } from '@rsbuild/shared';

vi.mock('@modern-js/utils', async (importOriginal) => {
  const mod = await importOriginal<any>();
  return {
    ...mod,
    isPackageInstalled: () => true,
  };
});

describe('splitChunks', () => {
  it('should apply antd/semi/... splitChunks rule when pkg is installed', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        performance: {},
      },
    });

    rsbuild.addPlugins([pluginReact()]);

    const config = await rsbuild.unwrapConfig();

    expect(config.optimization.splitChunks).toMatchSnapshot();
  });

  it('should not apply splitChunks rule when strategy is not split-by-experience', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        performance: {
          chunkSplit: {
            strategy: 'single-vendor',
          },
        },
      },
    });

    rsbuild.addPlugins([pluginReact()]);

    const config = await rsbuild.unwrapConfig();

    expect(config.optimization.splitChunks).toMatchSnapshot();
  });
});

describe('transformImport', () => {
  it('should apply antd & arco transformImport', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
    });

    rsbuild.addPlugins([pluginReact()]);

    const config = await rsbuild.unwrapConfig();

    expect(
      config.module.rules.find(
        (r) => r.test.toString() === mergeRegex(JS_REGEX, TS_REGEX).toString(),
      ),
    ).toMatchSnapshot();
  });

  it('should not apply antd & arco when transformImport is false', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        source: {
          transformImport: false,
        },
      },
    });

    rsbuild.addPlugins([pluginReact()]);

    const config = await rsbuild.unwrapConfig();

    expect(
      config.module.rules.find(
        (r) => r.test.toString() === mergeRegex(JS_REGEX, TS_REGEX).toString(),
      ),
    ).toMatchSnapshot();
  });
});

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
    {
      name: 'disableSvgr',
      pluginConfig: {
        disableSvgr: true,
      },
    },
  ];

  it.each(cases)('$name', async (item) => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
    });

    rsbuild.addPlugins([pluginReact(item.pluginConfig)]);

    const config = await rsbuild.unwrapConfig();

    expect(
      config.module.rules.find((r) => r.test === SVG_REGEX),
    ).toMatchSnapshot();
  });
});
