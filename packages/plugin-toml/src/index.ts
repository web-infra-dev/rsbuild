import { join } from 'path';
import type { RsbuildPlugin } from '@rsbuild/core';

export const pluginToml = (): RsbuildPlugin => ({
  name: 'rsbuild:toml',

  setup(api) {
    api.modifyBundlerChain((chain, { CHAIN_ID }) => {
      chain.module
        .rule(CHAIN_ID.RULE.TOML)
        .type('javascript/auto')
        .test(/\.toml$/)
        .use(CHAIN_ID.USE.TOML)
        .loader(join(__dirname, '../compiled', 'toml-loader'));
    });
  },
});
