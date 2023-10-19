import { describe, it, expect } from 'vitest';
import { createStubRsbuild } from '@rsbuild/vitest-helper';
import { pluginBabel } from '@/plugins/babel';

describe('plugins/babel', () => {
  it('should set babel-loader', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginBabel()],
      builderConfig: {
        tools: {
          babel(config: any) {
            config.plugins.push([
              'babel-plugin-import',
              {
                libraryName: 'xxx-components',
                libraryDirectory: 'es',
                style: true,
              },
            ]);
          },
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should not set babel-loader when babel config is return null', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginBabel()],
      builderConfig: {
        tools: {
          babel: () => {
            // do nothing
          },
        } as any,
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should not set babel-loader when babel config is null', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginBabel()],
      builderConfig: {
        tools: {
          babel: {},
        } as any,
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should not set babel-loader', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginBabel()],
      builderConfig: {
        tools: {},
      },
    });
    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });
});
