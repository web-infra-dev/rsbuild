import { RsbuildPlugin, RsbuildPluginAPI } from '@rsbuild/core';
import { logger, type ChainedConfig } from '@rsbuild/shared';
import { deepmerge } from '@rsbuild/shared/deepmerge';
import type ForkTSCheckerPlugin from 'fork-ts-checker-webpack-plugin';

type ForkTsCheckerOptions = ConstructorParameters<
  typeof ForkTSCheckerPlugin
>[0];

export type PluginTypeCheckerOptions = {
  enable?: boolean;
  forkTsCheckerOptions?: ChainedConfig<ForkTsCheckerOptions>;
};

export const pluginTypeCheck = (
  options: PluginTypeCheckerOptions = {},
): RsbuildPlugin<RsbuildPluginAPI> => {
  return {
    name: 'plugin-type-check',

    setup(api) {
      api.modifyBundlerChain(async (chain, { target }) => {
        const { enable = true, forkTsCheckerOptions } = options;

        if (!api.context.tsconfigPath || enable === false) {
          return;
        }

        // If there is multiple target, only apply type checker to the first target
        // to avoid multiple type checker running at the same time
        if (
          Array.isArray(api.context.target) &&
          target !== api.context.target[0]
        ) {
          return;
        }

        const { default: ForkTsCheckerWebpackPlugin } = await import(
          'fork-ts-checker-webpack-plugin'
        );
        const { CHAIN_ID, applyOptionsChain } = await import(
          '@modern-js/utils'
        );

        // use typescript of user project
        let typescriptPath: string;
        try {
          typescriptPath = require.resolve('typescript', {
            paths: [api.context.rootPath],
          });
        } catch (err) {
          logger.warn(
            '"typescript" is not found in current project, Type checker will not work.',
          );
          return;
        }

        const typeCheckerOptions = applyOptionsChain(
          {
            typescript: {
              // avoid OOM issue
              memoryLimit: 8192,
              // use tsconfig of user project
              configFile: api.context.tsconfigPath,
              typescriptPath,
            },
            issue: {
              exclude: [
                { file: '**/*.(spec|test).ts' },
                { file: '**/node_modules/**/*' },
              ],
            },
            logger: {
              log() {
                // do nothing
                // we only want to display error messages
              },
              error(message: string) {
                console.error(message.replace(/ERROR/g, 'Type Error'));
              },
            },
          },
          forkTsCheckerOptions,
          undefined,
          deepmerge,
        );

        if (
          api.context.bundlerType === 'rspack' &&
          chain.get('mode') === 'production'
        ) {
          logger.info('Ts checker running...');
          logger.info(
            'Ts checker is running slowly and will block builds until it is complete, please be patient and wait.',
          );
        }

        chain
          .plugin(CHAIN_ID.PLUGIN.TS_CHECKER)
          .use(ForkTsCheckerWebpackPlugin, [typeCheckerOptions]);
      });
    },
  };
};
