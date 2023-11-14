import { expect, describe, it, vi } from 'vitest';
import { pluginReact } from '../src';
import { createStubRsbuild } from '@rsbuild/test-helper';
import { SCRIPT_REGEX } from '@rsbuild/shared';

vi.mock('@rsbuild/shared', async (importOriginal) => {
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
        (r) => r.test.toString() === SCRIPT_REGEX.toString(),
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
        (r) => r.test.toString() === SCRIPT_REGEX.toString(),
      ),
    ).toMatchSnapshot();
  });
});
