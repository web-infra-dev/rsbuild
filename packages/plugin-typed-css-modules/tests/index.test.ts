import type { RspackConfig, RspackRule } from '@rsbuild/shared';
import { createStubRsbuild } from '@scripts/test-helper';
import { describe, expect, it, vi } from 'vitest';
import { pluginCss } from '../../core/src/plugins/css';
import { pluginTypedCSSModules } from '../src';

function matchRules(config: RspackConfig, testFile: string): RspackRule[] {
  if (!config.module?.rules) {
    return [];
  }
  return config.module.rules.filter((rule) => {
    if (
      rule &&
      typeof rule === 'object' &&
      rule.test &&
      rule.test instanceof RegExp &&
      rule.test.test(testFile)
    ) {
      return true;
    }
    return false;
  });
}

describe('plugin-typed-css-modules', () => {
  it('should apply css-modules-typescript-loader', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss(), pluginTypedCSSModules()],
    });
    const bundlerConfigs = await rsbuild.initConfigs();
    expect(matchRules(bundlerConfigs[0], 'a.css')).toMatchSnapshot();
  });

  it('should not apply css-modules-typescript-loader', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginCss(), pluginTypedCSSModules()],
      rsbuildConfig: {
        output: {
          cssModules: {
            auto: false,
          },
        },
      },
    });
    const bundlerConfigs = await rsbuild.initConfigs();
    expect(matchRules(bundlerConfigs[0], 'a.css')).toMatchSnapshot();
  });
});
