import { expect, describe, it } from 'vitest';
import { pluginLightningcss, lightningcss } from '../src';
import { createStubRsbuild } from '@scripts/test-helper';

describe('plugins/lightningcss', () => {
  it('plugin-lightningcss should replace postcss-loader with lightningcss-loader with default options', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginLightningcss()],
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs).toMatchSnapshot();
  });

  it('plugin-lightningcss should set lightningCssMinifyPlugin with default options', async () => {
    process.env.NODE_ENV = 'production';
    const rsbuild = await createStubRsbuild({
      plugins: [pluginLightningcss()],
    });
    const config = await rsbuild.unwrapConfig();
    expect(config.optimization).toMatchSnapshot();

    process.env.NODE_ENV = 'test';
  });

  it('plugin-lightningcss should be configurable by users', async () => {
    process.env.NODE_ENV = 'production';
    const rsbuild = await createStubRsbuild({
      plugins: [
        pluginLightningcss({
          transform: {
            cssModules: {
              dashedIdents: true,
              pattern: '[hash]-[local]',
            },
            visitor: {
              Length(len) {
                return {
                  unit: 'rem',
                  value: len.value,
                };
              },
            },
          },
          minify: {
            errorRecovery: true,
            exclude: lightningcss.Features.Colors,
          },
        }),
      ],
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();

    const config = await rsbuild.unwrapConfig();
    expect(config).toMatchSnapshot();

    process.env.NODE_ENV = 'test';
  });
});
