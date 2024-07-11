import { DEFAULT_WEB_BROWSERSLIST } from '../constants';
import type { RsbuildPlugin } from '../types';

const getESVersion = async (browserslist: string[]) => {
  const { browserslistToESVersion } = await import(
    'browserslist-to-es-version'
  );

  // skip calculation if the browserslist is the default value
  if (browserslist.join(',') === DEFAULT_WEB_BROWSERSLIST.join(',')) {
    return 2017;
  }

  return browserslistToESVersion(browserslist);
};

export const pluginTarget = (): RsbuildPlugin => ({
  name: 'rsbuild:target',

  setup(api) {
    api.modifyBundlerChain({
      order: 'pre',
      handler: async (chain, { target, environment }) => {
        if (target === 'node') {
          chain.target('node');
          return;
        }

        const { browserslist } = environment;
        const esVersion = await getESVersion(browserslist);

        if (target === 'web-worker') {
          chain.target(['webworker', `es${esVersion}`]);
          return;
        }

        chain.target(['web', `es${esVersion}`]);
      },
    });
  },
});
