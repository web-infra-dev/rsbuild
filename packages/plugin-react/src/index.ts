import { DefaultRsbuildPlugin } from '@rsbuild/shared';
import { applyAntdSupport } from './antd';
import { applyArcoSupport } from './arco';
import { applySplitChunksRule } from './splitChunks';
import { applyBasicReactSupport } from './react';
import { applySvgr, SvgDefaultExport } from './svg';

export type PluginReactOptions = {
  disableSvgr?: boolean;
  svgDefaultExport?: SvgDefaultExport;
};

const defaultOptions: Required<PluginReactOptions> = {
  disableSvgr: false,
  svgDefaultExport: 'url',
};

export const pluginReact = (
  options: PluginReactOptions = {},
): DefaultRsbuildPlugin => ({
  name: 'plugin-react',

  pre: ['plugin-swc'],

  setup(api) {
    const opts = {
      ...defaultOptions,
      ...options,
    };

    applyBasicReactSupport(api);
    applyAntdSupport(api);
    applyArcoSupport(api);
    applySplitChunksRule(api);
    applySvgr(api, opts);
  },
});
