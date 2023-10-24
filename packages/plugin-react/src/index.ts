import { DefaultRsbuildPlugin } from '@rsbuild/shared';
import { applyAntdSupport } from './antd';
import { applyArcoSupport } from './arco';
import { applySplitChunksRule } from './splitChunks';
import { applyBasicReactSupport } from './react';

export const pluginReact = (): DefaultRsbuildPlugin => ({
  name: 'plugin-react',

  pre: ['plugin-swc'],

  setup(api) {
    applyBasicReactSupport(api);
    applyAntdSupport(api);
    applyArcoSupport(api);
    applySplitChunksRule(api);
  },
});
