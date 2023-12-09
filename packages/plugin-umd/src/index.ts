import { isProd } from '@rsbuild/shared';
import type { RsbuildPlugin } from '@rsbuild/core';

export type PluginUmdOptions = {
  name: string;
};

export const pluginUmd = (options: PluginUmdOptions): RsbuildPlugin => ({
  name: 'rsbuild:umd',

  setup(api) {
    api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
      const userConfig = api.getRsbuildConfig('original');

      return mergeRsbuildConfig(config, {
        output: {
          distPath: {
            js: userConfig.output?.distPath?.js ?? '',
            css: userConfig.output?.distPath?.css ?? '',
          },
          disableFilenameHash: userConfig.output?.disableFilenameHash ?? true,
        },
        html: {
          // allows to test the umd bundle in the browser
          scriptLoading: userConfig.html?.scriptLoading ?? 'blocking',
        },
        tools: {
          htmlPlugin:
            userConfig.tools?.htmlPlugin ?? (isProd() ? false : undefined),
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
