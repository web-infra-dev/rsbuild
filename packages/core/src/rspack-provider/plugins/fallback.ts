import { join } from 'path';
import {
  getDistPath,
  getFilename,
  setConfig,
  resourceRuleFallback,
} from '@rsbuild/shared';
import type { RsbuildPlugin } from '../types';

export const pluginFallback = (): RsbuildPlugin => ({
  name: 'plugin-fallback',

  setup(api) {
    api.modifyRspackConfig((config, { isProd }) => {
      const rsbuildConfig = api.getNormalizedConfig();

      if (!rsbuildConfig.output.enableAssetFallback) {
        return;
      }

      const distDir = getDistPath(rsbuildConfig.output, 'media');
      const filename = getFilename(rsbuildConfig.output, 'media', isProd);

      setConfig(config, 'output.assetModuleFilename', join(distDir, filename));

      if (!config.module) {
        return;
      }

      setConfig(
        config,
        'module.rules',
        resourceRuleFallback(config.module?.rules),
      );
    });
  },
});
