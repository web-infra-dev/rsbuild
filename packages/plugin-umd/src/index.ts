import type { RsbuildPlugin } from '@rsbuild/core';

export type PluginUmdOptions = {
  name: string;
};

export const pluginUmd = (options: PluginUmdOptions): RsbuildPlugin => ({
  name: 'rsbuild:umd',

  setup(api) {
    api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
      return mergeRsbuildConfig(config, {
        output: {
          disableFilenameHash: true,
        },
      });
    });

    api.modifyBundlerChain(async (chain) => {
      chain.output.library({
        name: options.name,
        type: 'umd',
        umdNamedDefine: true,
      });

      // disable split chunks to output a single chunk
      chain.optimization.splitChunks(false);
    });
  },
});
