import { mergeChainedOptions } from '@rsbuild/shared';
import type { RsbuildPlugin } from '@rsbuild/core';
import type { Options as PugOptions } from 'pug';

export type PluginPugOptions = {
  /**
   * Used to set the compilation options for Pug.
   * @see https://pugjs.org/api/reference.html#options
   */
  pugOptions?: PugOptions;
};

export const pluginPug = (options: PluginPugOptions = {}): RsbuildPlugin => ({
  name: 'rsbuild:pug',

  async setup(api) {
    const VUE_SFC_REGEXP = /\.vue$/;
    const { compile, compileClient } = await import('pug');

    const pugOptions = mergeChainedOptions({
      defaults: {
        doctype: 'html',
        compileDebug: false,
      },
      options: options.pugOptions,
    });

    api.transform(
      { test: /\.pug$/ },
      ({ code, resourcePath, addDependency }) => {
        const options = {
          filename: resourcePath,
          ...pugOptions,
        };

        // Compile pug to HTML for Vue compiler
        if (VUE_SFC_REGEXP.test(resourcePath)) {
          const template = compile(code, options);
          const { dependencies } = template as unknown as {
            dependencies: string[];
          };

          if (dependencies) {
            dependencies.forEach(addDependency);
          }

          return template();
        }

        // Compile pug to JavaScript for html-webpack-plugin
        const templateCode = compileClient(code, options);
        return `${templateCode}; export default template;`;
      },
    );
  },
});
