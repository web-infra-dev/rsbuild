import type { RsbuildPlugin } from '@rsbuild/core';

// export type PluginMdxOptions = {
// };

export const pluginMdx = () // options: PluginMdxOptions = {}
: RsbuildPlugin => ({
  name: 'rsbuild:mdx',

  setup(api) {
    api.modifyBundlerChain((chain, { CHAIN_ID }) => {
      chain.resolve.extensions.add('.mdx');

      const jsRule = chain.module.rules.get(CHAIN_ID.RULE.JS);
      const mdxRule = chain.module.rule('mdx');

      [CHAIN_ID.USE.SWC, CHAIN_ID.USE.BABEL].some((id) => {
        const use = jsRule.uses.get(id);

        if (use) {
          mdxRule.use(id).loader(use.get('loader')).options(use.get('options'));
          return true;
        }

        return false;
      });

      mdxRule
        .test(/\.mdx?$/)
        .use('mdx')
        .loader(require.resolve('@mdx-js/loader'))
        .options({});
    });
  },
});
