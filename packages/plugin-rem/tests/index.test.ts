import { createRsbuild } from '@rsbuild/core';
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginSass } from '@rsbuild/plugin-sass';
import { matchPlugin, matchRules } from '@scripts/test-helper';
import { pluginRem } from '../src';

describe('plugin-rem', () => {
  it('should run rem plugin with default config', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [pluginLess(), pluginSass(), pluginRem()],
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(matchRules(bundlerConfigs[0], 'a.css')).toMatchSnapshot();
    expect(matchRules(bundlerConfigs[0], 'a.scss')).toMatchSnapshot();
    expect(matchRules(bundlerConfigs[0], 'a.less')).toMatchSnapshot();
  });

  it('should not run htmlPlugin with enableRuntime is false', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [pluginRem({ enableRuntime: false })],
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(matchRules(bundlerConfigs[0], 'a.css')).toMatchSnapshot();
  });

  it('should run rem plugin with custom config', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [
          pluginRem({
            rootFontSize: 30,
            pxtorem: {
              propList: ['font-size'],
            },
          }),
        ],
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(matchRules(bundlerConfigs[0], 'a.css')).toMatchSnapshot();
  });

  it('should not run rem plugin when target is node', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [pluginRem()],
        output: {
          target: 'node',
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(
      matchPlugin(bundlerConfigs[0], 'AutoSetRootFontSizePlugin'),
    ).toBeFalsy();
  });

  it('should not run rem plugin when target is web-worker', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [pluginRem()],
        output: {
          target: 'web-worker',
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(
      matchPlugin(bundlerConfigs[0], 'AutoSetRootFontSizePlugin'),
    ).toBeFalsy();
  });
});
