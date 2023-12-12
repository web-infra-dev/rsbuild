import { pluginRem } from '../src';
import { createStubRsbuild, matchPlugin } from '@rsbuild/test-helper';
import { pluginCss } from '../../core/src/provider/plugins/css';
import { pluginLess } from '../../core/src/provider/plugins/less';
import { pluginSass } from '../../core/src/provider/plugins/sass';

describe('plugin-rem', () => {
  it('should run rem plugin with default config', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss(), pluginLess(), pluginSass(), pluginRem()],
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should order plugins and run rem plugin with default config', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginRem(), pluginCss(), pluginLess(), pluginSass()],
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should not run htmlPlugin with enableRuntime is false', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss(), pluginRem({ enableRuntime: false })],
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should run rem plugin with custom config', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [
        pluginCss(),
        pluginRem({
          rootFontSize: 30,
          pxtorem: {
            propList: ['font-size'],
          },
        }),
      ],
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should not run rem plugin when target is node', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss(), pluginRem()],
      rsbuildConfig: {
        output: {
          targets: ['node'],
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(
      matchPlugin(bundlerConfigs[0], 'AutoSetRootFontSizePlugin'),
    ).toBeFalsy();
  });

  it('should not run rem plugin when target is web-worker', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss(), pluginRem()],
      rsbuildConfig: {
        output: {
          targets: ['web-worker'],
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(
      matchPlugin(bundlerConfigs[0], 'AutoSetRootFontSizePlugin'),
    ).toBeFalsy();
  });
});
