import type { RsbuildPlugin } from '@rsbuild/core';
import { applyAntdSupport } from './antd';
import { applyArcoSupport } from './arco';
import { applySplitChunksRule } from './splitChunks';
import { applyBasicReactSupport } from './react';

export { isBeyondReact17 } from './utils';

export const pluginReact = (): RsbuildPlugin => ({
  name: 'rsbuild:react',

  pre: ['rsbuild:swc'],

  setup(api) {
    if (api.context.bundlerType === 'rspack') {
      applyBasicReactSupport(api);
    }
    applyAntdSupport(api);
    applyArcoSupport(api);
    applySplitChunksRule(api);
  },
});
