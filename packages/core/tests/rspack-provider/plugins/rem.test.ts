import { describe, expect, it } from 'vitest';
import { pluginRem } from '@src/plugins/rem';
import { createStubBuilder, matchPlugin } from '@rsbuild/vitest-helper';
import { pluginCss } from '@/plugins/css';
import { pluginLess } from '@/plugins/less';
import { pluginSass } from '@/plugins/sass';

describe('plugins/rem', () => {
  it('should not run rem plugin without config', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginCss(), pluginRem()],
      builderConfig: {},
    });

    const bundlerConfigs = await builder.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
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

    const bundlerConfigs = await builder.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
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

    const bundlerConfigs = await builder.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();
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

    const bundlerConfigs = await builder.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();
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

    const bundlerConfigs = await builder.initConfigs();

    expect(bundlerConfigs[0].plugins?.length || 0).toBe(0);
    expect(bundlerConfigs[0]).toMatchSnapshot();
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

    const bundlerConfigs = await builder.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
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

    const bundlerConfigs = await builder.initConfigs();

    expect(
      matchPlugin(bundlerConfigs[0], 'AutoSetRootFontSizePlugin'),
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

    const bundlerConfigs = await builder.initConfigs();

    expect(
      matchPlugin(bundlerConfigs[0], 'AutoSetRootFontSizePlugin'),
    ).toBeFalsy();
  });
});
