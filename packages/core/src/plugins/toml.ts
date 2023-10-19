import {
  DefaultRsbuildPlugin,
  getSharedPkgCompiledPath,
} from '@rsbuild/shared';

export const pluginToml = (): DefaultRsbuildPlugin => ({
  name: 'plugin-toml',

  setup(api) {
    api.modifyBundlerChain((chain, { CHAIN_ID }) => {
      chain.module
        .rule(CHAIN_ID.RULE.TOML)
        .type('javascript/auto')
        .test(/\.toml$/)
        .use(CHAIN_ID.USE.TOML)
        .loader(getSharedPkgCompiledPath('toml-loader'));
    });
  },
});
