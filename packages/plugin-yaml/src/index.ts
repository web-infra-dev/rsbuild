import { join } from 'node:path';
import type { RsbuildPlugin } from '@rsbuild/core';

export const pluginYaml = (): RsbuildPlugin => ({
  name: 'rsbuild:yaml',

  setup(api) {
    api.modifyBundlerChain((chain, { CHAIN_ID }) => {
      chain.module
        .rule(CHAIN_ID.RULE.YAML)
        .type('javascript/auto')
        .test(/\.ya?ml$/)
        .use(CHAIN_ID.USE.YAML)
        .loader(join(__dirname, '../compiled', 'yaml-loader'));
    });
  },
});
