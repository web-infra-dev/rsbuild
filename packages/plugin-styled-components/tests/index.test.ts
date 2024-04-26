import { createRsbuild } from '@rsbuild/core';
import { SCRIPT_REGEX } from '@rsbuild/shared';
import { describe, expect, it } from 'vitest';
import { pluginStyledComponents } from '../src';

describe('plugins/styled-components', () => {
  it('should apply styledComponents option to swc-loader', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [pluginStyledComponents()],
      },
    });

    rsbuild.addPlugins([pluginStyledComponents()]);
    const configs = await rsbuild.initConfigs();

    expect(
      configs[0].module?.rules?.find(
        (rule) =>
          (rule as { test: RegExp }).test.toString() ===
          SCRIPT_REGEX.toString(),
      ),
    ).toMatchSnapshot();
  });

  it('should enable ssr option when target contains node', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        output: {
          targets: ['node', 'web'],
        },
        plugins: [pluginStyledComponents()],
      },
    });

    const configs = await rsbuild.initConfigs();

    for (const config of configs) {
      expect(
        config.module?.rules?.find(
          (rule) =>
            (rule as { test: RegExp }).test.toString() ===
            SCRIPT_REGEX.toString(),
        ),
      ).toMatchSnapshot();
    }
  });
});
