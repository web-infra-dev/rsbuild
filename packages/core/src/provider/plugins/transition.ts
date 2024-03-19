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

    // api.modifyRspackConfig((config, { isProd }) => {
    // only enable new tree shaking in production build,
    // because Rspack still has some problems when using it in dev mode.
    // such as https://github.com/web-infra-dev/rspack/issues/5887
    // if (isProd) {
    //   config.experiments ||= {};
    //   config.experiments.rspackFuture ||= {};
    //   config.experiments.rspackFuture.newTreeshaking = true;
    // }
    // });
  },
});
