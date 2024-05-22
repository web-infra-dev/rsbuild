import { createRsbuild } from '@rsbuild/core';
import { matchRules } from '@scripts/test-helper';
import { describe, expect, it } from 'vitest';
import { pluginTypedCSSModules } from '../src';

describe('plugin-typed-css-modules', () => {
  it('should apply css-modules-typescript-loader', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [pluginTypedCSSModules()],
      },
    });
    const bundlerConfigs = await rsbuild.initConfigs();
    expect(matchRules(bundlerConfigs[0], 'a.css')).toMatchSnapshot();
  });

  it('should not apply css-modules-typescript-loader', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [pluginTypedCSSModules()],
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
