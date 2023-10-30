import { join } from 'path';
import {
  getDistPath,
  getFilename,
  resourceRuleFallback,
} from '@rsbuild/shared';
import type { RsbuildPlugin } from '../types';

export const pluginFallback = (): RsbuildPlugin => ({
  name: 'plugin-fallback',

  setup(api) {
    api.modifyWebpackChain((chain, { isProd }) => {
      const rsbuildConfig = api.getNormalizedConfig();

      if (rsbuildConfig.output.enableAssetFallback) {
        const distDir = getDistPath(rsbuildConfig.output, 'media');
        const filename = getFilename(rsbuildConfig.output, 'media', isProd);

        chain.output.merge({
          assetModuleFilename: join(distDir, filename),
        });
      }
    });

    api.modifyWebpackConfig((config) => {
      const rsbuildConfig = api.getNormalizedConfig();

      if (!rsbuildConfig.output.enableAssetFallback || !config.module) {
        return;
      }

      config.module.rules = resourceRuleFallback(config.module.rules);
    });
  },
});
