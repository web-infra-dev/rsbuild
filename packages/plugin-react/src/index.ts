import type { RsbuildPlugin } from '@rsbuild/core';
import { applyAntdSupport } from './antd';
import { applyArcoSupport } from './arco';
import { applySplitChunksRule } from './splitChunks';
import { applyBasicReactSupport } from './react';

export const pluginReact = (): RsbuildPlugin => ({
  name: 'plugin-react',

  pre: ['plugin-swc'],

  setup(api) {
    if (api.context.bundlerType === 'rspack') {
      applyBasicReactSupport(api);
    }
    applyAntdSupport(api);
    applyArcoSupport(api);
    applySplitChunksRule(api);
  },
});
