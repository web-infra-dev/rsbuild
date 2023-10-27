import path from 'path';
import { logger } from '@rsbuild/shared';
import type { RsbuildPlugin, RsbuildPluginAPI } from '@rsbuild/core';

export type PluginSvelteOptions = {};

export function pluginSvelte(
  options: PluginSvelteOptions = {},
): RsbuildPlugin<RsbuildPluginAPI> {
  return {
    name: 'plugin-svelte',

    async setup(api) {
      let sveltePath: string = '';
      try {
        // resolve `svelte` package path from the project directory
        sveltePath = path.dirname(
          require.resolve('svelte/package.json', {
            paths: [api.context.rootPath],
          }),
        );
      } catch (err) {
        logger.error(
          `Cannot resolve \`svelte\` package under the project directory, did you forget to install it?`,
        );
        throw new Error(`Cannot resolve \`svelte\` package`, {
          cause: err,
        });
      }

      api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
        return mergeRsbuildConfig(config, {
          source: {
            alias: {
              svelte: path.join(sveltePath, 'src/runtime'),
            },
          },
        });
      });

      api.modifyBundlerChain(async (chain, { CHAIN_ID, isProd }) => {
        chain.resolve.extensions.add('.svelte');

        chain.module
          .rule(CHAIN_ID.RULE.SVELTE)
          .test(/\.svelte$/)
          .use(CHAIN_ID.USE.VUE)
          .loader(require.resolve('svelte-loader'))
          .options({
            compilerOptions: {
              dev: !isProd,
            },
            emitCss: isProd,
            hotReload: !isProd,
          });
      });
    },
  };
}
