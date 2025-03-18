import path from 'node:path';
import { rspack } from '@rspack/core';
import { COMPILED_PATH } from '../constants';
import type { RsbuildPlugin } from '../types';

export const pluginSri = (): RsbuildPlugin => ({
  name: 'rsbuild:sri',

  setup(api) {
    api.modifyBundlerChain((chain, { environment }) => {
      const { config, htmlPaths } = environment;

      if (Object.keys(htmlPaths).length === 0) {
        return;
      }

      const { sri } = config.security;
      const enable =
        sri.enable === 'auto' ? config.mode === 'production' : sri.enable;

      if (!enable) {
        return;
      }

      // SRI requires a cross-origin policy
      const crossorigin = chain.output.get('crossOriginLoading');
      if (crossorigin === false || crossorigin === undefined) {
        chain.output.crossOriginLoading('anonymous');
      }

      const { algorithm = 'sha384' } = sri;

      chain.plugin('sri').use(rspack.experiments.SubresourceIntegrityPlugin, [
        {
          enabled: true,
          hashFuncNames: [algorithm],
          htmlPlugin: path.join(COMPILED_PATH, 'html-rspack-plugin/index.js'),
        },
      ]);
    });
  },
});
