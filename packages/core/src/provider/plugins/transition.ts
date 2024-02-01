import type { RsbuildPlugin } from '../../types';

/**
 * Provide some temporary configurations for Rspack early transition
 */
export const pluginTransition = (): RsbuildPlugin => ({
  name: 'rsbuild:transition',

  setup() {
    process.env.RSPACK_CONFIG_VALIDATE = 'loose-silent';

    // improve kill process performance
    // https://github.com/web-infra-dev/rspack/pull/5486
    process.env.WATCHPACK_WATCHER_LIMIT ||= '20';
  },
});
