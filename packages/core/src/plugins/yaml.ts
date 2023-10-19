import {
  DefaultRsbuildPlugin,
  getSharedPkgCompiledPath,
} from '@rsbuild/shared';

export const pluginYaml = (): DefaultRsbuildPlugin => ({
  name: 'plugin-yaml',

  setup(api) {
    api.modifyBundlerChain((chain, { CHAIN_ID }) => {
      chain.module
        .rule(CHAIN_ID.RULE.YAML)
        .type('javascript/auto')
        .test(/\.ya?ml$/)
        .use(CHAIN_ID.USE.YAML)
        .loader(getSharedPkgCompiledPath('yaml-loader'));
    });
  },
});
