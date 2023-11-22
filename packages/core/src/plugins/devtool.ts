import { isUseJsSourceMap } from '@rsbuild/shared';
import type { RsbuildPlugin } from '../types';

export const pluginDevtool = (): RsbuildPlugin => ({
  name: 'rsbuild:devtool',

  setup(api) {
    api.modifyBundlerChain((chain, { isProd, isServer }) => {
      const config = api.getNormalizedConfig();

      if (!isUseJsSourceMap(config)) {
        chain.devtool(false);
      } else {
        const prodDevTool = isServer ? 'source-map' : 'hidden-source-map';
        const devtool = isProd
          ? // hide the source map URL in production to avoid Chrome warning
            prodDevTool
          : 'cheap-module-source-map';
        chain.devtool(devtool);
      }
    });
  },
});
