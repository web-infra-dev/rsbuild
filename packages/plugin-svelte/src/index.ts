import path from 'node:path';
import { logger } from '@rsbuild/core';
import type { RsbuildPlugin } from '@rsbuild/core';
import { deepmerge } from '@rsbuild/shared';
import type { sveltePreprocess } from 'svelte-preprocess';
import type { CompileOptions } from 'svelte/compiler';

export type AutoPreprocessOptions = NonNullable<
  Parameters<typeof sveltePreprocess>[0]
>;

export interface SvelteLoaderOptions {
  compilerOptions?: Omit<CompileOptions, 'filename' | 'format' | 'generate'>;
  /**
   * Extra HMR options, the defaults are completely fine\
   * You can safely omit hotOptions altogether
   */
  hotOptions?: {
    /** Preserve local component state */
    preserveLocalState?: boolean;
    [key: string]: any;
  };
  [key: string]: any;
}

export type PluginSvelteOptions = {
  /**
   * The options of svelte-loader
   * @see https://github.com/sveltejs/svelte-loader
   */
  svelteLoaderOptions?: SvelteLoaderOptions;
  /**
   * The options of svelte-preprocess.
   * @see https://github.com/sveltejs/svelte-preprocess
   */
  preprocessOptions?: AutoPreprocessOptions;
};

export const PLUGIN_SVELTE_NAME = 'rsbuild:svelte';

export function pluginSvelte(options: PluginSvelteOptions = {}): RsbuildPlugin {
  return {
    name: PLUGIN_SVELTE_NAME,

    setup(api) {
      let sveltePath = '';
      try {
        // Resolve `svelte` package path from the project directory
        sveltePath = path.dirname(
          require.resolve('svelte/package.json', {
            paths: [api.context.rootPath],
          }),
        );
      } catch (err) {
        logger.error(
          'Cannot resolve `svelte` package under the project directory, did you forget to install it?',
        );
        throw new Error('Cannot resolve `svelte` package', {
          cause: err,
        });
      }

      api.modifyBundlerChain(
        async (chain, { CHAIN_ID, environment, isDev }) => {
          const { default: sveltePreprocess } = await import(
            'svelte-preprocess'
          );

          const environmentConfig = environment.config;

          chain.resolve.alias.set(
            'svelte',
            path.join(sveltePath, 'src/runtime'),
          );
          chain.resolve.extensions.add('.svelte');
          chain.resolve.mainFields.add('svelte').add('...');
          chain.resolve.conditionNames.add('svelte').add('...');

          const loaderPath = require.resolve('svelte-loader');

          // We need to set an alias from `svelte-loader` to its realpath.
          // Because with `emitCss` option on, the loader generates css
          // imports with inline loader reference like `!svelte-loader...`,
          // which would cause the bundler failed to resolve the loader.
          // See https://github.com/sveltejs/svelte-loader/blob/344f00744b06a98ff5ee7e7a04d5e04ac496988c/index.js#L128
          chain.merge({
            resolveLoader: {
              alias: {
                'svelte-loader': loaderPath,
              },
            },
          });

          const svelteLoaderOptions = deepmerge(
            {
              compilerOptions: {
                dev: isDev,
              },
              preprocess: sveltePreprocess(options.preprocessOptions),
              emitCss: !environmentConfig.output.injectStyles,
              hotReload: isDev && environmentConfig.dev.hmr,
            },
            options.svelteLoaderOptions ?? {},
          );

          chain.module
            .rule(CHAIN_ID.RULE.SVELTE)
            .test(/\.svelte$/)
            .use(CHAIN_ID.USE.SVELTE)
            .loader(loaderPath)
            .options(svelteLoaderOptions);
        },
      );
    },
  };
}
