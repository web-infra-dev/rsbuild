import { join } from 'node:path';
import type { RsbuildPlugin } from '../types';

export const pluginNodeAddons = (): RsbuildPlugin => ({
  name: 'rsbuild:node-addons',

  setup(api) {
    api.modifyBundlerChain(async (chain, { isServer, CHAIN_ID }) => {
      if (!isServer) {
        return;
      }

      chain.module
        .rule(CHAIN_ID.RULE.NODE)
        .test(/\.node$/)
        .use(CHAIN_ID.USE.NODE)
        .loader(join(__dirname, '../rspack/nodeAddonsLoader'));
    });
  },
});
