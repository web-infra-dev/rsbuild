import { createRsbuild } from '@rsbuild/core';
import { matchRules } from '@scripts/test-helper';
import { describe, expect, it } from 'vitest';
import { pluginStyledComponents } from '../src';

describe('plugins/styled-components', () => {
  it('should apply styledComponents option to swc-loader', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        plugins: [pluginStyledComponents()],
      },
    });

    const configs = await rsbuild.initConfigs();
    expect(matchRules(configs[0], 'a.tsx')[0]).toMatchSnapshot();
  });

  it('should enable ssr option when target contains node', async () => {
    const rsbuild = await createRsbuild({
      rsbuildConfig: {
        environments: {
          node: {
            output: {
              target: 'node',
            },
          },
          web: {
            output: {
              target: 'web',
            },
          },
        },
        plugins: [pluginStyledComponents()],
      },
    });

    const configs = await rsbuild.initConfigs();

    for (const config of configs) {
      expect(matchRules(config, 'a.tsx')[0]).toMatchSnapshot();
    }
  });
});
