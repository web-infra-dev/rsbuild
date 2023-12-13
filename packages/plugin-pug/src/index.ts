import path from 'path';
import { mergeChainedOptions } from '@rsbuild/shared';
import type { RsbuildPlugin } from '@rsbuild/core';
import type { Options as PugOptions } from 'pug';

export type PluginPugOptions = {
  pugOptions?: PugOptions;
};

export const pluginPug = (options: PluginPugOptions = {}): RsbuildPlugin => ({
  name: 'rsbuild:pug',

  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID }) => {
      const pugOptions = mergeChainedOptions({
        defaults: {},
        options: options.pugOptions,
      });

      chain.module
        .rule(CHAIN_ID.RULE.PUG)
        .test(/\.pug$/)
        .use(CHAIN_ID.USE.PUG)
        .loader(path.resolve(__dirname, './loader'))
        .options(pugOptions);
    });
  },
});
