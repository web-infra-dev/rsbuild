import { createRsbuild } from '@rsbuild/core';
import {
  type RspackConfig,
  type RuleSetRule,
  isPlainObject,
} from '@rsbuild/shared';
import { createStubRsbuild } from '@scripts/test-helper';
import { describe, expect, it } from 'vitest';
import { lightningcss, pluginLightningcss } from '../src';

const getCssRules = (rspackConfig: RspackConfig) => {
  const CSS_RULES = ['css', 'scss', 'sass', 'less', 'stylus'];

  return (
    (rspackConfig.module?.rules?.filter((item) => {
      const isRule =
        isPlainObject(item) &&
        CSS_RULES.some((txt) =>
          item.test?.toString().replace(/[\W]/g, '').includes(txt),
        );
      return isRule;
    }) as RuleSetRule[]) ?? []
  );
};

describe('plugins/lightningcss', () => {
  it('plugin-lightningcss should replace postcss-loader with lightningcss-loader with default options', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [pluginLightningcss()],
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    const cssRules = getCssRules(bundlerConfigs[0]);
    expect(cssRules).toMatchSnapshot();
    expect(cssRules).not.contain('postcss-loader');
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

  it('plugin-lightningcss should not set lightningCssMinifyPlugin with minify: false', async () => {
    process.env.NODE_ENV = 'production';
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        output: {
          minify: false,
        },
      },
      plugins: [
        pluginLightningcss({
          minify: {
            errorRecovery: true,
            exclude: lightningcss.Features.Colors,
          },
        }),
      ],
    });

    const config = await rsbuild.unwrapConfig();
    expect(config.optimization).toMatchSnapshot();

    process.env.NODE_ENV = 'test';
  });

  it('plugin-lightningcss should not set lightningCssMinifyPlugin with minify.css: false', async () => {
    process.env.NODE_ENV = 'production';
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        output: {
          minify: {
            css: false,
          },
        },
      },
      plugins: [
        pluginLightningcss({
          minify: {
            errorRecovery: true,
            exclude: lightningcss.Features.Colors,
          },
        }),
      ],
    });

    const config = await rsbuild.unwrapConfig();
    expect(config.optimization).toMatchSnapshot();

    process.env.NODE_ENV = 'test';
  });

  it('plugin-lightningcss should be configurable by users', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [
          pluginLightningcss({
            implementation: {
              transform: lightningcss.transform,
              browserslistToTargets: lightningcss.browserslistToTargets,
            },
            transform: {
              errorRecovery: true,
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
              cssModules: {
                dashedIdents: true,
                pattern: '[hash]-[local]',
              },
            },
          }),
        ],
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    const cssRules = getCssRules(bundlerConfigs[0]);
    expect(cssRules).toMatchSnapshot();
    expect(cssRules).not.contain('postcss-loader');

    expect(bundlerConfigs[0].optimization?.minimizer).toMatchSnapshot();

    process.env.NODE_ENV = 'test';
  });

  it('plugin-lightningcss should be configurable by users with true options', async () => {
    process.env.NODE_ENV = 'production';
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [
          pluginLightningcss({
            transform: true,
            minify: true,
          }),
        ],
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    const cssRules = getCssRules(bundlerConfigs[0]);
    expect(cssRules).toMatchSnapshot();
    expect(cssRules).not.contain('postcss-loader');

    expect(bundlerConfigs[0].optimization?.minimizer).toMatchSnapshot();

    process.env.NODE_ENV = 'test';
  });

  it('plugin-lightningcss should be cancelable by users with false options', async () => {
    process.env.NODE_ENV = 'production';
    const rsbuild = await createStubRsbuild({
      plugins: [
        pluginLightningcss({
          transform: false,
          minify: false,
        }),
      ],
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();

    process.env.NODE_ENV = 'test';
  });
});
