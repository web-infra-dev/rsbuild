import type { RsbuildPlugin } from '../../types';
import { applyResolvePlugin } from '@rsbuild/shared';

export const pluginResolve = (): RsbuildPlugin => ({
  name: 'rsbuild:resolve',

  setup(api) {
    applyResolvePlugin(api);

    api.modifyRspackConfig(async (rspackConfig, { isServer }) => {
      const isTsProject = Boolean(api.context.tsconfigPath);
      const config = api.getNormalizedConfig();

      rspackConfig.resolve ||= {};

      if (isTsProject && config.source.aliasStrategy === 'prefer-tsconfig') {
        rspackConfig.resolve.tsConfigPath = api.context.tsconfigPath;
      }

      if (isServer) {
        // FIXME:
        // When targe = node, we no need to specify conditionsNames.
        // We guess the webpack would auto specify reference to target.
        // Rspack has't the action, so we need manually specify.
        rspackConfig.resolve.conditionNames = ['require', 'node'];
      }
    });
  },
});
