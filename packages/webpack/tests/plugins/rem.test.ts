import { describe, expect, it } from 'vitest';
import { pluginRem } from '@rsbuild/core/plugins/rem';
import { pluginCss } from '@/plugins/css';
import { pluginLess } from '@/plugins/less';
import { pluginSass } from '@/plugins/sass';
import { createStubRsbuild } from '../helper';

describe('plugins/rem', () => {
  it('should not run rem plugin without config', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss(), pluginRem()],
      rsbuildConfig: {},
    });

    const config = await rsbuild.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should not run rem plugin when false', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss(), pluginRem()],
      rsbuildConfig: {
        output: {
          convertToRem: false,
        },
      },
    });

    const config = await rsbuild.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should run rem plugin with default config', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss(), pluginLess(), pluginSass(), pluginRem()],
      rsbuildConfig: {
        output: {
          convertToRem: true,
        },
      },
    });

    const config = await rsbuild.unwrapWebpackConfig();

    // should add AutoSetRootFontSizePlugin and postcss-rem plugin
    expect(config).toMatchSnapshot();
  });

  it('should order plugins and run rem plugin with default config', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginRem(), pluginCss(), pluginLess(), pluginSass()],
      rsbuildConfig: {
        output: {
          convertToRem: true,
        },
      },
    });

    const config = await rsbuild.unwrapWebpackConfig();

    // should add AutoSetRootFontSizePlugin and postcss-rem plugin
    expect(config).toMatchSnapshot();
  });

  it('should not run htmlPlugin with enableRuntime is false', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss(), pluginRem()],
      rsbuildConfig: {
        output: {
          convertToRem: {
            enableRuntime: false,
          },
        },
      },
    });

    const config = await rsbuild.unwrapWebpackConfig();

    expect(config.plugins?.length || 0).toBe(0);
    expect(config).toMatchSnapshot();
  });

  it('should run rem plugin with custom config', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss(), pluginRem()],
      rsbuildConfig: {
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

    const config = await rsbuild.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should not run rem plugin when target is node', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss(), pluginRem()],
      rsbuildConfig: {
        output: {
          convertToRem: true,
        },
      },
      target: ['node'],
    });

    expect(
      await rsbuild.matchWebpackPlugin('AutoSetRootFontSizePlugin'),
    ).toBeFalsy();
  });

  it('should not run rem plugin when target is web-worker', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss(), pluginRem()],
      rsbuildConfig: {
        output: {
          convertToRem: true,
        },
      },
      target: ['web-worker'],
    });

    expect(
      await rsbuild.matchWebpackPlugin('AutoSetRootFontSizePlugin'),
    ).toBeFalsy();
  });
});
