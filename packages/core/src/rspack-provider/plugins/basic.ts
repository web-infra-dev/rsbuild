import type { BuilderPlugin } from '../types';
import { applyBuilderBasicPlugin } from '@rsbuild/shared';

/**
 * Provide some basic configs of rspack
 */
export const builderPluginBasic = (): BuilderPlugin => ({
  name: 'builder-plugin-basic',

  setup(api) {
    applyBuilderBasicPlugin(api);
  },
});
