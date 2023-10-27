import { DefaultRsbuildPlugin } from '@rsbuild/shared';
import { applyRspackBabelConfig } from './rspack';
import { PluginBabelOptions } from './type';

export const pluginBabel = (
  options: PluginBabelOptions = {},
): DefaultRsbuildPlugin => ({
  name: 'plugin-babel',

  setup(api) {
    if (api.context.bundlerType === 'rspack') {
      applyRspackBabelConfig(api, options);
    }
  },
});
