import type { RsbuildPlugin } from '@rsbuild/core';

export type PluginUmdOptions = {
  /**
   * `name` is a required field used to specify the name of the UMD library.
   */
  name: string;
  /**
   * Specifies which export to use as the content of the UMD library.
   */
  export?: string | string[];
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
          filenameHash: userConfig.output?.filenameHash ?? false,
        },
        html: {
          // allows to test the UMD bundle in the browser
          scriptLoading: userConfig.html?.scriptLoading ?? 'blocking',
        },
        tools: {
          htmlPlugin:
            userConfig.tools?.htmlPlugin ??
            (process.env.NODE_ENV === 'production' ? false : undefined),
        },
        performance: {
          chunkSplit: {
            // UMD outputs are usually distributed via a single <script> tag,
            // so we use `all-in-one` as the default chunk splitting strategy.
            strategy:
              userConfig.performance?.chunkSplit?.strategy ?? 'all-in-one',
          },
        },
      });
    });

    api.modifyBundlerChain(async (chain) => {
      chain.output.library({
        name: options.name,
        type: 'umd',
        // name the AMD module of the UMD build
        umdNamedDefine: true,
        export: options.export,
      });

      // To make UMD build available on both browsers and Node.js
      chain.output.globalObject('this');
    });
  },
});
