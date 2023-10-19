import { describe, it, expect } from 'vitest';
import { createStubBuilder } from '@rsbuild/vitest-helper';
import { pluginBabel } from '@/plugins/babel';

describe('plugins/babel', () => {
  it('should set babel-loader', async () => {
    const builder = await createStubBuilder({
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

    const bundlerConfigs = await builder.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should not set babel-loader when babel config is return null', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginBabel()],
      builderConfig: {
        tools: {
          babel: () => {
            // do nothing
          },
        } as any,
      },
    });

    const bundlerConfigs = await builder.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should not set babel-loader when babel config is null', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginBabel()],
      builderConfig: {
        tools: {
          babel: {},
        } as any,
      },
    });

    const bundlerConfigs = await builder.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should not set babel-loader', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginBabel()],
      builderConfig: {
        tools: {},
      },
    });
    const bundlerConfigs = await builder.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });
});
