import path from 'node:path';
import { logger } from '@rsbuild/core';
import { deepmerge } from '@rsbuild/shared';
import type { RsbuildPlugin } from '@rsbuild/core';
import type { CompileOptions } from 'svelte/compiler';
import type {
  AutoPreprocessOptions,
  Transformer,
} from 'svelte-preprocess/dist/types';

export type { AutoPreprocessOptions, Transformer };

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

export function pluginSvelte(options: PluginSvelteOptions = {}): RsbuildPlugin {
  return {
    name: 'rsbuild:svelte',

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

      api.modifyBundlerChain(async (chain, { CHAIN_ID, isDev }) => {
        const { default: sveltePreprocess } = await import('svelte-preprocess');

        const rsbuildConfig = api.getNormalizedConfig();

        chain.resolve.alias.set('svelte', path.join(sveltePath, 'src/runtime'));
        chain.resolve.extensions.add('.svelte');
        chain.resolve.mainFields.add('svelte').add('...');
        chain.resolve.set('conditionNames', ['svelte', '...']);

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
            emitCss: !rsbuildConfig.output.injectStyles,
            hotReload: isDev && rsbuildConfig.dev.hmr,
          },
          options.svelteLoaderOptions ?? {},
        );

        chain.module
          .rule(CHAIN_ID.RULE.SVELTE)
          .test(/\.svelte$/)
          .use(CHAIN_ID.USE.SVELTE)
          .loader(loaderPath)
          .options(svelteLoaderOptions);
      });
    },
  };
}
