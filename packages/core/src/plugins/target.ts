import {
  browserslistToESVersion,
  getBrowserslistWithDefault,
} from '@rsbuild/shared';
import type { RsbuildPlugin } from '../types';

export const pluginTarget = (): RsbuildPlugin => ({
  name: 'rsbuild:target',

  setup(api) {
    api.modifyBundlerChain({
      order: 'pre',
      handler: async (chain, { target }) => {
        if (target === 'node') {
          chain.target('node');
          return;
        }

        const config = api.getNormalizedConfig();
        const browserslist = await getBrowserslistWithDefault(
          api.context.rootPath,
          config,
          target,
        );
        const esVersion = browserslistToESVersion(browserslist);

        if (target === 'web-worker' || target === 'service-worker') {
          chain.target(['webworker', `es${esVersion}`]);
          return;
        }

        chain.target(['web', `es${esVersion}`]);
      },
    });
  },
});
