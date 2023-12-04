import type { RsbuildPlugin } from '../../types';
import { applyBasicPlugin } from '@rsbuild/shared';

/**
 * Provide some basic configs of rspack
 */
export const pluginBasic = (): RsbuildPlugin => ({
  name: 'rsbuild:basic',

  setup(api) {
    applyBasicPlugin(api);
  },
});
