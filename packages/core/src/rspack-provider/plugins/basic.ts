import type { BuilderPlugin } from '../types';
import { applyBuilderBasicPlugin } from '@rsbuild/shared';

/**
 * Provide some basic configs of rspack
 */
export const pluginBasic = (): BuilderPlugin => ({
  name: 'plugin-basic',

  setup(api) {
    applyBuilderBasicPlugin(api);
  },
});
