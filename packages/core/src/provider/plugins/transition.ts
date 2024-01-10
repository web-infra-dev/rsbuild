import { setConfig } from '@rsbuild/shared';
import type { RsbuildPlugin } from '../../types';

/**
 * Provide some temporary configurations for Rspack early transition
 */
export const pluginTransition = (): RsbuildPlugin => ({
  name: 'rsbuild:transition',

  setup(api) {
    process.env.RSPACK_CONFIG_VALIDATE = 'loose-silent';

    api.modifyRspackConfig((config) => {
      setConfig(config, 'experiments.rspackFuture.newTreeshaking', true);
    });
  },
});
