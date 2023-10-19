import type { BuilderPlugin } from '../types';

import { setConfig, isUsingHMR } from '@rsbuild/shared';

export const pluginHMR = (): BuilderPlugin => ({
  name: 'plugin-hmr',

  setup(api) {
    api.modifyRspackConfig((rspackConfig, utils) => {
      const config = api.getNormalizedConfig();

      const usingHMR = isUsingHMR(config, utils);

      setConfig(rspackConfig, 'devServer.hot', usingHMR);
    });
  },
});
