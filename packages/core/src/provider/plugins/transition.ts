import type { RsbuildPlugin } from '../../types';

/**
 * Provide some temporary configurations for Rspack early transition
 */
export const pluginTransition = (): RsbuildPlugin => ({
  name: 'rsbuild:transition',

  setup() {
    process.env.RSPACK_CONFIG_VALIDATE = 'loose-silent';
  },
});
