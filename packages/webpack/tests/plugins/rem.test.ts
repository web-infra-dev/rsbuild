import { describe, expect, it } from 'vitest';
import { pluginRem } from '@rsbuild/core/plugins/rem';
import { pluginCss } from '@/plugins/css';
import { pluginLess } from '@/plugins/less';
import { pluginSass } from '@/plugins/sass';
import { createStubBuilder } from '../helper';

describe('plugins/rem', () => {
  it('should not run rem plugin without config', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginCss(), pluginRem()],
      builderConfig: {},
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should not run rem plugin when false', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginCss(), pluginRem()],
      builderConfig: {
        output: {
          convertToRem: false,
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should run rem plugin with default config', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginCss(), pluginLess(), pluginSass(), pluginRem()],
      builderConfig: {
        output: {
          convertToRem: true,
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();

    // should add AutoSetRootFontSizePlugin and postcss-rem plugin
    expect(config).toMatchSnapshot();
  });

  it('should order plugins and run rem plugin with default config', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginRem(), pluginCss(), pluginLess(), pluginSass()],
      builderConfig: {
        output: {
          convertToRem: true,
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();

    // should add AutoSetRootFontSizePlugin and postcss-rem plugin
    expect(config).toMatchSnapshot();
  });

  it('should not run htmlPlugin with enableRuntime is false', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginCss(), pluginRem()],
      builderConfig: {
        output: {
          convertToRem: {
            enableRuntime: false,
          },
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();

    expect(config.plugins?.length || 0).toBe(0);
    expect(config).toMatchSnapshot();
  });

  it('should run rem plugin with custom config', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginCss(), pluginRem()],
      builderConfig: {
        output: {
          convertToRem: {
            rootFontSize: 30,
            pxtorem: {
              propList: ['font-size'],
            },
          },
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should not run rem plugin when target is node', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginCss(), pluginRem()],
      builderConfig: {
        output: {
          convertToRem: true,
        },
      },
      target: ['node'],
    });

    expect(
      await builder.matchWebpackPlugin('AutoSetRootFontSizePlugin'),
    ).toBeFalsy();
  });

  it('should not run rem plugin when target is web-worker', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginCss(), pluginRem()],
      builderConfig: {
        output: {
          convertToRem: true,
        },
      },
      target: ['web-worker'],
    });

    expect(
      await builder.matchWebpackPlugin('AutoSetRootFontSizePlugin'),
    ).toBeFalsy();
  });
});
