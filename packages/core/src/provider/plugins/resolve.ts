import type { RsbuildPlugin } from '../../types';
import { applyResolvePlugin } from '@rsbuild/shared';

export const pluginResolve = (): RsbuildPlugin => ({
  name: 'rsbuild:resolve',

  setup(api) {
    applyResolvePlugin(api);

    api.modifyRspackConfig(async (rspackConfig) => {
      const isTsProject = Boolean(api.context.tsconfigPath);
      const config = api.getNormalizedConfig();

      rspackConfig.resolve ||= {};

      if (isTsProject && config.source.aliasStrategy === 'prefer-tsconfig') {
        rspackConfig.resolve.tsConfigPath = api.context.tsconfigPath;
      }
    });
  },
});
