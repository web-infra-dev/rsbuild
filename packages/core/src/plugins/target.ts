import { getBrowserslist } from '@rsbuild/shared';
import type { RsbuildPlugin } from '../types';

export const pluginTarget = (): RsbuildPlugin => ({
  name: 'rsbuild:target',

  setup(api) {
    api.modifyBundlerChain(async (chain, { target }) => {
      if (target === 'node') {
        chain.target('node');
        return;
      }
      if (target === 'service-worker') {
        chain.target('webworker');
        return;
      }

      // browserslist is not supported when target is web-worker
      if (target === 'web-worker') {
        chain.target(['webworker', 'es5']);
        return;
      }

      const browserslist = await getBrowserslist(api.context.rootPath);

      if (browserslist) {
        chain.merge({ target: ['web', 'browserslist'] });
      } else {
        chain.merge({ target: ['web', 'es5'] });
      }
    });
  },
});
