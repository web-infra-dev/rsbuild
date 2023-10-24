import path from 'path';
import type { RsbuildPlugin } from '../types';
import { mergeChainedOptions } from '@rsbuild/shared';

export const pluginPug = (): RsbuildPlugin => ({
  name: 'plugin-pug',

  setup(api) {
    api.modifyWebpackChain(async (chain, { CHAIN_ID }) => {
      const config = api.getNormalizedConfig();
      const { pug } = config.tools;
      if (!pug) {
        return;
      }

      chain.module
        .rule(CHAIN_ID.RULE.PUG)
        .test(/\.pug$/)
        .use(CHAIN_ID.USE.PUG)
        .loader(path.resolve(__dirname, '../webpackLoaders/pugLoader'))
        .options(mergeChainedOptions({}, pug === true ? {} : pug));
    });
  },
});
